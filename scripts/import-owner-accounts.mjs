#!/usr/bin/env node
/**
 * Import listing owners from a CSV export into the app project as login accounts.
 *
 * Source : a CSV like `listings_rows.csv` (one row per property; owner details
 *          embedded as owner_name / owner_phone / owner_city; NO email).
 * Target : project jhihqmkqvbwfniwculhk, schema hostiggo_testing_schema.
 *
 * Per DISTINCT owner (deduped by normalized phone) it:
 *   1. creates a Supabase Auth user by PHONE (phone_confirm=true, no password,
 *      no email) — this is the login. Creating it sends NO SMS.
 *   2. upserts a `users` profile row (user_id = auth id, name, phone; email null).
 *   3. inserts a `host` row (user_id + a freshly generated host_uuid) if none yet.
 *
 * It also writes `owner-account-map.csv` next to the input file:
 *   phone,name,city,user_id,host_uuid,status
 * That map is what a later step uses to migrate/link the 108 listings
 * (listings.host_uuid = the owner's host_uuid).
 *
 * Idempotent: existing auth users are matched by phone and reused, so re-running
 * is safe and will not create duplicates.
 *
 * RUN:
 *   node import-owner-accounts.mjs "<path to csv>" --dry-run      # preview, no writes
 *   node import-owner-accounts.mjs "<path to csv>" --limit 1      # do just the first (live)
 *   node import-owner-accounts.mjs "<path to csv>"                # full live run
 *
 * Env (for the TARGET app project):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const SCHEMA = "hostiggo_testing_schema";

// ----------------------------- args / env ---------------------------------
const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run") || argv.includes("--dry");
const limIdx = argv.indexOf("--limit");
const limit = limIdx >= 0 ? Number(argv[limIdx + 1]) : undefined;
const csvPath = argv.find((a) => !a.startsWith("--") && a !== String(limit));

if (!csvPath) {
  console.error('Provide the CSV path, e.g.  node import-owner-accounts.mjs "listings_rows.csv" --dry-run');
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY for the target app project.");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: SCHEMA },
});

// ------------------------------- helpers -----------------------------------
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", i = 0, q = false;
  while (i < text.length) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i += 2; continue; } q = false; i++; continue; }
      field += c; i++; continue;
    }
    if (c === '"') { q = true; i++; continue; }
    if (c === ",") { row.push(field); field = ""; i++; continue; }
    if (c === "\r") { i++; continue; }
    if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    field += c; i++;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const collapse = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const digits = (p) => (p ? String(p).replace(/\D/g, "") : "");

// India-centric E.164 normalization.
function normPhone(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const hasPlus = s.startsWith("+");
  let d = digits(s);
  if (!d) return null;
  if (hasPlus) return "+" + d;
  if (d.length === 12 && d.startsWith("91")) return "+" + d;
  if (d.length === 11 && (d[0] === "0" || d[0] === "1")) d = d.slice(1); // strip stray leading 0/1
  if (d.length === 10) return "+91" + d;
  return "+" + d; // unusual — will be flagged
}

// ------------------------- manual corrections -----------------------------
// Human-reviewed fixes applied to the raw rows before grouping. See discussion:
// husband/wife and shared-phone cases can't map 1:1 to phone-unique auth users.
const CORRECTIONS = {
  // Move rows matching (whenPhone, whenName) onto a different phone.
  phoneReassign: [
    { whenPhone: "+919997109939", whenName: "sandeep ji", newPhone: "+919560449266" },
  ],
  // Force the account display name for a given FINAL phone.
  nameOverride: {
    "+919606904343": "Arpa Dasgupta", // collapse all Arpa variants
    "+919389002425": "Samrit Ji",     // Vijay + Samrit merged under Samrit
    "+919560449266": "Sandeep Ji",    // Sandeep's consolidated account
    "+919997109939": "Deepanshu Ji",  // Sandeep rows moved out; Deepanshu remains
  },
};

function applyPhoneCorrection(phone, name) {
  const nm = collapse(name).toLowerCase();
  for (const rule of CORRECTIONS.phoneReassign) {
    if (phone === rule.whenPhone && nm === rule.whenName) return rule.newPhone;
  }
  return phone;
}

async function loadExistingByPhone() {
  const byPhone = new Map();
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const u of data.users) if (u.phone) byPhone.set(digits(u.phone), u.id);
    if (data.users.length < 1000) break;
    page++;
  }
  return byPhone;
}

// ------------------------------ load + group -------------------------------
const matrix = parseCSV(readFileSync(csvPath, "utf8"));
const header = matrix[0];
const body = matrix.slice(1).filter((r) => r.length > 1);
const ix = (n) => header.indexOf(n);
const iName = ix("owner_name"), iPhone = ix("owner_phone"), iCity = ix("owner_city");

/** phone -> { names: Map<name,count>, cities:Set, raws:Set, listingCount } */
const owners = new Map();
for (const r of body) {
  let phone = normPhone(r[iPhone]);
  if (!phone) continue;
  phone = applyPhoneCorrection(phone, r[iName]);
  if (!owners.has(phone)) owners.set(phone, { names: new Map(), cities: new Set(), raws: new Set(), listingCount: 0 });
  const o = owners.get(phone);
  o.listingCount++;
  o.raws.add(String(r[iPhone]).trim());
  const nm = collapse(r[iName]);
  if (nm) o.names.set(nm, (o.names.get(nm) ?? 0) + 1);
  const ct = collapse(r[iCity]);
  if (ct) o.cities.add(ct);
}

// Best display name: most frequent, tie-break by longer string.
function bestName(names) {
  return [...names.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)[0]?.[0] ?? null;
}

let list = [...owners.entries()].map(([phone, o]) => ({
  phone,
  name: CORRECTIONS.nameOverride[phone] ?? bestName(o.names),
  city: [...o.cities][0] ?? null,
  listingCount: o.listingCount,
  altNames: [...o.names.keys()],
  raws: [...o.raws],
  flagged: digits(phone).length !== 12,
  nameConflict: new Set([...o.names.keys()].map((n) => n.toLowerCase())).size > 1,
}));
list.sort((a, b) => b.listingCount - a.listingCount);
if (limit) list = list.slice(0, limit);

// --------------------------------- run -------------------------------------
console.log(`\n${dryRun ? "DRY RUN — no writes" : "LIVE RUN — writing to " + SUPABASE_URL}`);
console.log(`Source: ${csvPath}`);
console.log(`Listings: ${body.length}   Distinct owners: ${owners.size}${limit ? `   (processing ${list.length})` : ""}\n`);

const existingByPhone = await loadExistingByPhone();
const outRows = [["phone", "name", "city", "user_id", "host_uuid", "status"]];
const summary = { created: 0, reused: 0, profiles: 0, hosts: 0, failed: 0 };

for (const o of list) {
  const flags = [o.flagged ? "⚠PHONE" : "", o.nameConflict ? "⚠NAMES:" + o.altNames.join("/") : ""].filter(Boolean).join(" ");
  const head = `- ${o.name}  ${o.phone}  (${o.listingCount} listing${o.listingCount > 1 ? "s" : ""}) ${flags}`;
  try {
    let userId = existingByPhone.get(digits(o.phone)) ?? null;
    let status;

    if (userId) {
      console.log(`${head}\n    account exists (${userId}) — reuse`);
      status = "reused"; summary.reused++;
    } else if (dryRun) {
      console.log(`${head}\n    would CREATE auth account (phone)`);
      status = "would-create"; summary.created++;
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        phone: o.phone,
        phone_confirm: true,
        user_metadata: o.name ? { name: o.name } : undefined,
      });
      if (error) throw error;
      userId = data.user.id;
      existingByPhone.set(digits(o.phone), userId);
      console.log(`${head}\n    created account ${userId}`);
      status = "created"; summary.created++;
    }

    // profile
    if (!dryRun && userId) {
      const { error } = await admin.from("users").upsert(
        { user_id: userId, name: o.name, phone: o.phone, is_active: true, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
      if (error) throw error;
      summary.profiles++;
    }

    // host row (generate host_uuid if the user has none yet)
    let hostUuid = null;
    if (!dryRun && userId) {
      const { data: h, error: hErr } = await admin.from("host").select("host_uuid").eq("user_id", userId).maybeSingle();
      if (hErr) throw hErr;
      if (h?.host_uuid) {
        hostUuid = h.host_uuid;
      } else {
        hostUuid = randomUUID();
        const { error: iErr } = await admin.from("host").insert({ user_id: userId, host_uuid: hostUuid });
        if (iErr) throw iErr;
        summary.hosts++;
      }
    }

    outRows.push([o.phone, o.name ?? "", o.city ?? "", userId ?? "", hostUuid ?? "", status]);
  } catch (e) {
    console.log(`${head}\n    ✗ ${e?.message ?? e}`);
    summary.failed++;
    outRows.push([o.phone, o.name ?? "", o.city ?? "", "", "", "ERROR:" + (e?.message ?? e)]);
  }
}

// write the phone -> user_id/host_uuid map (used later to link listings)
if (!dryRun) {
  const mapPath = join(dirname(csvPath), "owner-account-map.csv");
  const csv = outRows.map((r) => r.map((c) => (/[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c)).join(",")).join("\n");
  writeFileSync(mapPath, csv);
  console.log(`\nWrote mapping → ${mapPath}`);
}

console.log("\n──────── summary ────────");
console.log(`  accounts ${dryRun ? "to create" : "created"} : ${summary.created}`);
console.log(`  accounts reused        : ${summary.reused}`);
console.log(`  profiles upserted      : ${summary.profiles}`);
console.log(`  host rows inserted     : ${summary.hosts}`);
console.log(`  failed                 : ${summary.failed}`);
if (dryRun) console.log("\n(dry run — nothing written. Re-run without --dry-run to apply.)");
