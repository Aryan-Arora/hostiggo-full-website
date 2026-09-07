#!/usr/bin/env node
/**
 * Bulk-create login accounts for listing owners.
 *
 * WHAT THIS DOES (per owner row in your source table):
 *   1. Creates a Supabase Auth user (auth.users) — this IS "the account".
 *      Your login is passwordless (email / SMS OTP), so no password is set.
 *      Created with email_confirm/phone_confirm = true so the owner can sign in
 *      immediately with an OTP code. NOTE: this does NOT send any email or SMS —
 *      accounts are created silently. (We deliberately do NOT use
 *      inviteUserByEmail, which would email every owner.)
 *   2. Upserts the app profile row (hostiggo_testing_schema.users, user_id = auth id).
 *   3. Ensures a host row (hostiggo_testing_schema.host) bridging user_id <-> host_uuid,
 *      which is how listings connect to their owner (listings.host_uuid).
 *
 * It is idempotent: existing auth users are matched by email/phone and reused,
 * so you can re-run it safely.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SETUP
 *   1. Get your service_role key: Supabase Dashboard → Project Settings → API →
 *      "service_role" secret. Put it in .env.local (gitignored) as:
 *        NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
 *        SUPABASE_SERVICE_ROLE_KEY=<service_role secret>
 *   2. Edit the CONFIG block below so it matches your source table + columns.
 *
 * RUN (Node 20.6+ can load the env file directly):
 *   node --env-file=.env.local scripts/create-owner-accounts.mjs inspect
 *   node --env-file=.env.local scripts/create-owner-accounts.mjs run --dry-run
 *   node --env-file=.env.local scripts/create-owner-accounts.mjs run --limit 3
 *   node --env-file=.env.local scripts/create-owner-accounts.mjs run
 *
 *   (Older Node: set the two env vars in your shell first, then drop --env-file.)
 *
 * ALWAYS run `inspect` first to confirm column names, then `run --dry-run` to
 * preview every write before doing it for real.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

// ============================ CONFIG — EDIT ME ==============================
const CONFIG = {
  schema: "hostiggo_testing_schema",

  // The table that already holds your owner details.
  sourceTable: "users", //  <-- CHANGE if owners live in a different table

  // Map your source table's column names here.
  columns: {
    name: "name",
    email: "email",
    phone: "phone",
    // If each owner row ALREADY carries the host_uuid that its listings point to,
    // put that column name here — the host row will reuse it and the listings
    // stay connected automatically. Leave null to generate a fresh host_uuid.
    existingHostUuid: null, // e.g. "host_uuid"
  },

  // Optional: only process rows where this boolean column is truthy.
  // null = process every row in the source table.
  filterColumn: null, // e.g. "is_owner"

  // Phone numbers must reach Supabase in E.164 (e.g. +919876543210).
  // Bare 10-digit numbers get this country code prepended. Set null to disable.
  defaultCountryCode: "+91",

  // Table names (only change if yours differ).
  usersTable: "users",
  hostTable: "host",
};
// ===========================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "\nMissing env. Provide NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Easiest: put them in .env.local and run with:\n" +
      "  node --env-file=.env.local scripts/create-owner-accounts.mjs <command>\n",
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: CONFIG.schema },
});

// ------------------------------- helpers -----------------------------------
const digits = (p) => (p ? String(p).replace(/\D/g, "") : "");

function normalizePhone(raw) {
  if (raw == null) return null;
  const p = String(raw).trim();
  if (!p) return null;
  if (p.startsWith("+")) return p;
  const d = digits(p);
  if (!d) return null;
  if (CONFIG.defaultCountryCode && d.length === 10) {
    return CONFIG.defaultCountryCode + d;
  }
  return "+" + d;
}

const normEmail = (raw) => {
  const e = raw == null ? "" : String(raw).trim().toLowerCase();
  return e || null;
};

// Pull every existing auth user once, indexed by email and by phone digits, so
// re-runs reuse accounts instead of erroring on "already registered".
async function loadExistingAuthUsers() {
  const byEmail = new Map();
  const byPhone = new Map();
  let page = 1;
  const perPage = 1000;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    for (const u of users) {
      if (u.email) byEmail.set(u.email.toLowerCase(), u.id);
      if (u.phone) byPhone.set(digits(u.phone), u.id);
    }
    if (users.length < perPage) break;
    page += 1;
  }
  return { byEmail, byPhone };
}

async function fetchOwners(limit) {
  let q = admin.from(CONFIG.sourceTable).select("*");
  if (CONFIG.filterColumn) q = q.eq(CONFIG.filterColumn, true);
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

// --------------------------------- inspect ---------------------------------
async function dumpTable(table, n) {
  console.log(`\n=== ${CONFIG.schema}.${table} (first ${n} rows) ===`);
  const { data, error } = await admin.from(table).select("*").limit(n);
  if (error) {
    console.log(`  ⚠️  ${error.message}`);
    return;
  }
  if (!data?.length) {
    console.log("  (no rows)");
    return;
  }
  console.log("  columns:", Object.keys(data[0]).join(", "));
  data.forEach((row, i) => console.log(`  [${i}]`, JSON.stringify(row)));
}

async function inspect() {
  console.log("Inspecting your data (read-only)...");
  await dumpTable(CONFIG.sourceTable, 5);
  await dumpTable(CONFIG.hostTable, 5);
  console.log(
    "\nUse the column names above to fill in CONFIG.columns, then run:\n" +
      "  node --env-file=.env.local scripts/create-owner-accounts.mjs run --dry-run",
  );
}

// ----------------------------- host row logic ------------------------------
async function ensureHostRow(userId, knownHostUuid, dryRun, summary) {
  if (knownHostUuid) {
    // Owner already carries the host_uuid its listings point to. Bridge it to
    // this account (create the host row, or repoint an existing one).
    const { data: existing, error } = await admin
      .from(CONFIG.hostTable)
      .select("user_id, host_uuid")
      .eq("host_uuid", knownHostUuid)
      .maybeSingle();
    if (error) throw error;

    if (existing) {
      if (existing.user_id === userId) return;
      console.log(`    host: repoint host_uuid ${knownHostUuid} -> user ${userId}`);
      if (!dryRun) {
        const { error: uErr } = await admin
          .from(CONFIG.hostTable)
          .update({ user_id: userId })
          .eq("host_uuid", knownHostUuid);
        if (uErr) throw uErr;
      }
      summary.hosts++;
      return;
    }
    console.log(`    host: insert (user ${userId}, host_uuid ${knownHostUuid})`);
    if (!dryRun) {
      const { error: iErr } = await admin
        .from(CONFIG.hostTable)
        .insert({ user_id: userId, host_uuid: knownHostUuid });
      if (iErr) throw iErr;
    }
    summary.hosts++;
    return;
  }

  // No known host_uuid: create one only if this user has no host row yet.
  if (!userId) {
    console.log("    host: (dry-run new user) would create host row");
    return;
  }
  const { data: existing, error } = await admin
    .from(CONFIG.hostTable)
    .select("host_uuid")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (existing?.host_uuid) return; // already a host

  const newHostUuid = randomUUID();
  console.log(`    host: insert (user ${userId}, generated host_uuid ${newHostUuid})`);
  if (!dryRun) {
    const { error: iErr } = await admin
      .from(CONFIG.hostTable)
      .insert({ user_id: userId, host_uuid: newHostUuid });
    if (iErr) throw iErr;
  }
  summary.hosts++;
}

// ------------------------------ per-owner ----------------------------------
async function processOwner(owner, existing, dryRun, summary) {
  const name = owner[CONFIG.columns.name] ?? null;
  const email = normEmail(owner[CONFIG.columns.email]);
  const phone = normalizePhone(owner[CONFIG.columns.phone]);
  const label = name || email || phone || "(unnamed)";

  if (!email && !phone) {
    console.log(`- ${label}: SKIP (no email or phone)`);
    summary.failed++;
    return;
  }

  // 1) Auth account — reuse if one already matches this email/phone.
  let userId =
    (email && existing.byEmail.get(email)) ||
    (phone && existing.byPhone.get(digits(phone))) ||
    null;

  if (userId) {
    console.log(`- ${label}: account exists (${userId}) — reusing`);
    summary.reused++;
  } else if (dryRun) {
    console.log(`- ${label}: would CREATE account (email=${email ?? "-"}, phone=${phone ?? "-"})`);
    summary.created++;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: email ?? undefined,
      phone: phone ?? undefined,
      email_confirm: Boolean(email),
      phone_confirm: Boolean(phone),
      user_metadata: name ? { name } : undefined,
    });
    if (error) throw error;
    userId = data.user.id;
    if (email) existing.byEmail.set(email, userId);
    if (phone) existing.byPhone.set(digits(phone), userId);
    console.log(`- ${label}: created account ${userId}`);
    summary.created++;
  }

  // 2) Profile row (users). Mirrors the app's upsertUser shape.
  if (userId) {
    console.log(`    profile: upsert users(user_id=${userId})`);
    if (!dryRun) {
      const { error } = await admin
        .from(CONFIG.usersTable)
        .upsert(
          {
            user_id: userId,
            name,
            email,
            phone,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
      if (error) throw error;
    }
    summary.profiles++;
  }

  // 3) Host row (bridges account -> host_uuid -> listings).
  const knownHostUuid = CONFIG.columns.existingHostUuid
    ? owner[CONFIG.columns.existingHostUuid] ?? null
    : null;
  await ensureHostRow(userId, knownHostUuid, dryRun, summary);
}

// --------------------------------- run -------------------------------------
async function run({ dryRun, limit }) {
  console.log(
    `\n${dryRun ? "DRY RUN — no writes." : "LIVE RUN — writing to Supabase."}` +
      `  Source: ${CONFIG.schema}.${CONFIG.sourceTable}\n`,
  );

  const owners = await fetchOwners(limit);
  console.log(`Found ${owners.length} owner row(s) to process.\n`);
  if (!owners.length) return;

  const existing = await loadExistingAuthUsers();
  const summary = { created: 0, reused: 0, profiles: 0, hosts: 0, failed: 0 };

  for (const owner of owners) {
    try {
      await processOwner(owner, existing, dryRun, summary);
    } catch (e) {
      summary.failed++;
      console.error(`  ✗ error on row:`, e?.message ?? e);
    }
  }

  console.log("\n──────── summary ────────");
  console.log(`  accounts created/queued : ${summary.created}`);
  console.log(`  accounts reused          : ${summary.reused}`);
  console.log(`  profile rows upserted    : ${summary.profiles}`);
  console.log(`  host rows written        : ${summary.hosts}`);
  console.log(`  failed rows              : ${summary.failed}`);
  if (dryRun) console.log("\n(dry run — nothing was written. Re-run without --dry-run to apply.)");
}

// --------------------------------- cli -------------------------------------
async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const dryRun = argv.includes("--dry-run") || argv.includes("--dry");
  const limitFlag = argv.indexOf("--limit");
  const limit = limitFlag >= 0 ? Number(argv[limitFlag + 1]) : undefined;

  if (cmd === "inspect") return inspect();
  if (cmd === "run") return run({ dryRun, limit });

  console.log(
    "Usage:\n" +
      "  node --env-file=.env.local scripts/create-owner-accounts.mjs inspect\n" +
      "  node --env-file=.env.local scripts/create-owner-accounts.mjs run --dry-run\n" +
      "  node --env-file=.env.local scripts/create-owner-accounts.mjs run --limit 3\n" +
      "  node --env-file=.env.local scripts/create-owner-accounts.mjs run\n",
  );
}

main().catch((e) => {
  console.error("\nFatal:", e?.message ?? e);
  process.exit(1);
});
