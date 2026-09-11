#!/usr/bin/env node
/**
 * Migrate the intake CSV listings into the app schema and link each to its owner.
 *
 * Source : listings_rows.csv (108 flat rows; owner identified by owner_phone).
 * Target : jhihqmkqvbwfniwculhk, schema hostiggo_testing_schema.
 * Owners : owner-account-map.csv (produced by import-owner-accounts.mjs) gives
 *          phone -> host_uuid. We normalize each row's owner_phone (applying the
 *          SAME corrections as the account import) and look up its host_uuid.
 *
 * Per CSV row it inserts (mirroring the app's createListing path):
 *   listings (main row, is_active=false, source='intake_csv', external_listing_id=<csv id>)
 *   + listing_amenities, listing_bedrooms, listing_house_rules, listing_safety
 *   (no listing_media — the CSV has no photos.)
 *
 * Idempotent: rows whose external_listing_id already exists under source
 * 'intake_csv' are skipped, so re-running never double-imports.
 *
 * RUN:
 *   node import-listings.mjs "<listings csv>" --dry-run     # preview, no writes
 *   node import-listings.mjs "<listings csv>" --limit 1     # migrate just the first (live)
 *   node import-listings.mjs "<listings csv>"               # full live run
 *   (add --active to import as is_active=true instead of pending)
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (target app project)
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const SCHEMA = "hostiggo_testing_schema";
const SOURCE_TAG = "intake_csv";

// -------- CSV value -> app lookup id maps (verified against the live tables) --
const PROPERTY_TYPE = { apartment: 2, house: 1, guesthouse: 3, villa: 8, cottage: 7, farmstay: 9 };
const STAY_TYPE = { entire: 1, private: 2 };
const AMENITY = {
  wifi: 1, ac: 2, heating: 3, kitchen: 4, washing: 5, parking: 7, tv: 8,
  pool: 11, gym: 12, balcony: 14, smoke: 16, extinguisher: 17, firstaid: 18,
  pets: 19, bbq: 21, garden: 22,
}; // carbon / dining / firepit have no matching amenity row → skipped

// Phone routing correction — MUST match import-owner-accounts.mjs so a listing
// goes to the same account its owner was created under.
const PHONE_REASSIGN = [{ whenPhone: "+919997109939", whenName: "sandeep ji", newPhone: "+919560449266" }];

// ------------------------------- args / env --------------------------------
const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run") || argv.includes("--dry");
const active = argv.includes("--active");
const limIdx = argv.indexOf("--limit");
const limit = limIdx >= 0 ? Number(argv[limIdx + 1]) : undefined;
const csvPath = argv.find((a) => !a.startsWith("--") && a !== String(limit));
if (!csvPath) { console.error('Provide the listings CSV path.'); process.exit(1); }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) { console.error("Missing target env vars."); process.exit(1); }

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: SCHEMA },
});

// --------------------------------- helpers ---------------------------------
function parseCSV(t) {
  const R = []; let r = [], f = "", i = 0, q = false;
  while (i < t.length) { const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i += 2; continue; } q = false; i++; continue; } f += c; i++; continue; }
    if (c === '"') { q = true; i++; continue; }
    if (c === ",") { r.push(f); f = ""; i++; continue; }
    if (c === "\r") { i++; continue; }
    if (c === "\n") { r.push(f); R.push(r); r = []; f = ""; i++; continue; }
    f += c; i++; }
  if (f.length || r.length) { r.push(f); R.push(r); }
  return R;
}
const rows2objs = (m) => { const h = m[0]; return m.slice(1).filter((r) => r.length > 1).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i]]))); };
const collapse = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const digits = (p) => (p ? String(p).replace(/\D/g, "") : "");
function normPhone(raw) {
  const s = String(raw ?? "").trim(); if (!s) return null;
  const plus = s.startsWith("+"); let d = digits(s); if (!d) return null;
  if (plus) return "+" + d;
  if (d.length === 12 && d.startsWith("91")) return "+" + d;
  if (d.length === 11 && (d[0] === "0" || d[0] === "1")) d = d.slice(1);
  if (d.length === 10) return "+91" + d;
  return "+" + d;
}
function routePhone(phone, name) {
  const nm = collapse(name).toLowerCase();
  for (const r of PHONE_REASSIGN) if (phone === r.whenPhone && nm === r.whenName) return r.newPhone;
  return phone;
}
const bool = (v) => String(v).trim().toUpperCase() === "TRUE";
function toTime(v) {
  const s = String(v ?? "").trim(); if (!s) return null;
  const [hh, mm = "0"] = s.split(":");
  return `${String(+hh).padStart(2, "0")}:${String(+mm).padStart(2, "0")}:00`;
}
const num = (v) => { const n = Number(String(v).trim()); return Number.isFinite(n) ? n : null; };
const jparse = (v, fb) => { try { return JSON.parse(v || ""); } catch { return fb; } };

// ------------------------------ load inputs --------------------------------
const listings = rows2objs(parseCSV(readFileSync(csvPath, "utf8")));

const mapPath = join(dirname(csvPath), "owner-account-map.csv");
const mapObjs = rows2objs(parseCSV(readFileSync(mapPath, "utf8")));
const hostByPhone = new Map(mapObjs.map((o) => [o.phone, o.host_uuid]));

// Preload already-imported external ids for idempotency.
async function loadImported() {
  const set = new Set();
  const { data, error } = await admin.from("listings").select("external_listing_id").eq("source", SOURCE_TAG);
  if (error) throw error;
  for (const r of data) if (r.external_listing_id) set.add(r.external_listing_id);
  return set;
}

// ------------------------------ build a draft ------------------------------
function buildRow(o) {
  const phone = routePhone(normPhone(o.owner_phone), o.owner_name);
  const host_uuid = hostByPhone.get(phone) ?? null;
  const beds = jparse(o.bedrooms, []);
  const bd = Array.isArray(beds) ? beds : [];
  const sum = (k) => bd.reduce((s, x) => s + (Number(x?.[k]) || 0), 0);
  const amenSlugs = jparse(o.amenities, []);
  const amenityIds = (Array.isArray(amenSlugs) ? amenSlugs : []).map((s) => AMENITY[s]).filter(Boolean);
  const skipped = (Array.isArray(amenSlugs) ? amenSlugs : []).filter((s) => !AMENITY[s]);
  return {
    host_uuid, phone, skipped, bedrooms: bd, amenityIds,
    listing: {
      title: collapse(o.property_title) || "Untitled listing",
      description: "",
      price_weekday: num(o.weekday_price) ?? 0,
      price_weekend: num(o.weekend_price) ?? num(o.weekday_price) ?? 0,
      num_bedrooms: bd.length || 1,
      num_beds: sum("beds") || 1,
      num_guests: sum("guests") || 1,
      num_bathrooms: sum("bathrooms") || 1,
      host_uuid,
      is_active: active,
      currency: "INR",
      check_in_time: toTime(o.check_in_time) ?? "14:00:00",
      check_out_time: toTime(o.check_out_time) ?? "11:00:00",
      address_line1: collapse(o.street_address) || null,
      address_line2: [o.city, o.state, o.postal_code].map(collapse).filter(Boolean).join(", ") || null,
      landmark: collapse(o.nearby_landmark) || null,
      latitude: num(o.latitude),
      longitude: num(o.longitude),
      pincode: Number.isInteger(num(o.postal_code)) ? num(o.postal_code) : null,
      property_type_id: PROPERTY_TYPE[collapse(o.property_type).toLowerCase()] ?? null,
      stay_type_id: STAY_TYPE[collapse(o.accommodation_type).toLowerCase()] ?? null,
      lisiting_status: active ? 1 : null,
      source: SOURCE_TAG,
      external_listing_id: o.id,
      created_at: o.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    rules: {
      check_in_time: toTime(o.check_in_time),
      check_out_time: toTime(o.check_out_time),
      smoking_allowed: bool(o.smoking_allowed),
      pets_allowed: bool(o.pets_allowed),
      parties_allowed: bool(o.parties_allowed),
      quiet_hours: bool(o.quiet_hours),
    },
    safety: {
      security_camera: bool(o.has_exterior_camera),
      smoke_alarm: bool(o.has_smoke_alarm),
      noise_monitoring: false,
      weapons: false,
    },
  };
}

// --------------------------------- run -------------------------------------
console.log(`\n${dryRun ? "DRY RUN — no writes" : "LIVE RUN — " + SUPABASE_URL}`);
console.log(`Source: ${csvPath}   Rows: ${listings.length}   is_active=${active}\n`);

let work = listings.map(buildRow);
if (limit) work = work.slice(0, limit);

const imported = await loadImported();
const outRows = [["external_listing_id", "listing_id", "host_uuid", "title", "status"]];
const summary = { inserted: 0, skipped: 0, failed: 0, noHost: 0, warnings: 0 };

for (const w of work) {
  const tag = `- ${w.listing.title}  [${w.phone}]`;
  if (!w.host_uuid) { console.log(`${tag}\n    ✗ no host for phone (not in owner map)`); summary.noHost++; summary.failed++; outRows.push([w.listing.external_listing_id, "", "", w.listing.title, "NO_HOST"]); continue; }
  if (!w.listing.property_type_id) console.log(`${tag}\n    ⚠ unmapped property_type`);
  if (imported.has(w.listing.external_listing_id)) { console.log(`${tag}\n    already imported — skip`); summary.skipped++; outRows.push([w.listing.external_listing_id, "", w.host_uuid, w.listing.title, "SKIP"]); continue; }

  if (dryRun) {
    console.log(`${tag}\n    would INSERT → host ${w.host_uuid.slice(0, 8)}…  type=${w.listing.property_type_id} stay=${w.listing.stay_type_id} guests=${w.listing.num_guests} beds=${w.listing.num_beds} amenities=${w.amenityIds.length}${w.skipped.length ? " (skip:" + w.skipped.join(",") + ")" : ""}`);
    summary.inserted++;
    continue;
  }

  try {
    const { data: ins, error } = await admin.from("listings").insert(w.listing).select("listing_id, title").single();
    if (error) throw error;
    const id = ins.listing_id;

    if (w.amenityIds.length) {
      const { error: e } = await admin.from("listing_amenities").insert(w.amenityIds.map((amenity_id) => ({ listing_id: id, amenity_id })));
      if (e) { console.log(`    ⚠ amenities: ${e.message}`); summary.warnings++; }
    }
    if (w.bedrooms.length) {
      const { error: e } = await admin.from("listing_bedrooms").insert(w.bedrooms.map((b, i) => ({ listing_id: id, bedroom_index: i, beds: Number(b.beds) || 0, bathrooms: Number(b.bathrooms) || 0, max_guests: Number(b.guests) || 0 })));
      if (e) { console.log(`    ⚠ bedrooms: ${e.message}`); summary.warnings++; }
    }
    {
      const { error: e } = await admin.from("listing_house_rules").insert({ listing_id: id, ...w.rules });
      if (e) { console.log(`    ⚠ house_rules: ${e.message}`); summary.warnings++; }
    }
    {
      const { error: e } = await admin.from("listing_safety").insert({ listing_id: id, ...w.safety });
      if (e) { console.log(`    ⚠ safety: ${e.message}`); summary.warnings++; }
    }
    console.log(`${tag}\n    inserted listing_id=${id}`);
    summary.inserted++;
    outRows.push([w.listing.external_listing_id, String(id), w.host_uuid, w.listing.title, "INSERTED"]);
  } catch (e) {
    console.log(`${tag}\n    ✗ ${e?.message ?? e}`);
    summary.failed++;
    outRows.push([w.listing.external_listing_id, "", w.host_uuid, w.listing.title, "ERROR:" + (e?.message ?? e)]);
  }
}

if (!dryRun) {
  const p = join(dirname(csvPath), "listing-import-map.csv");
  writeFileSync(p, outRows.map((r) => r.map((c) => (/[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c)).join(",")).join("\n"));
  console.log(`\nWrote → ${p}`);
}

console.log("\n──────── summary ────────");
console.log(`  listings ${dryRun ? "to insert" : "inserted"} : ${summary.inserted}`);
console.log(`  skipped (already imported): ${summary.skipped}`);
console.log(`  no host / failed          : ${summary.noHost} / ${summary.failed}`);
console.log(`  detail warnings           : ${summary.warnings}`);
if (dryRun) console.log("\n(dry run — nothing written.)");
