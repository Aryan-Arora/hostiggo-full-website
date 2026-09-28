#!/usr/bin/env node
/**
 * Option A: backfill listings.location_id for the imported listings by
 * find-or-creating canonical rows in the `locations` table.
 *
 * Source of truth for each listing's geography = the intake CSV's clean
 * `city` / `state` / `postal_code` columns (matched to the listing by
 * external_listing_id). Grain = one locations row per (state, city).
 * Dedup key = normalize(state)+"|"+normalize(city), where normalize strips
 * diacritics + case + extra spaces (so "haryāna"=="haryana", "Dehradun"=="dehradun").
 *
 * RUN:
 *   node backfill-locations.mjs "<csv>" --dry-run     # report, no writes
 *   node backfill-locations.mjs "<csv>" --limit 1     # do just the first listing (live)
 *   node backfill-locations.mjs "<csv>"               # full
 *
 * Env: APP_URL, APP_KEY
 */
import { readFileSync } from "node:fs";

const APP_URL = process.env.APP_URL, APP_KEY = process.env.APP_KEY;
if (!APP_URL || !APP_KEY) { console.error("Missing APP_URL / APP_KEY"); process.exit(1); }
const argv = process.argv.slice(2);
const dry = argv.includes("--dry-run") || argv.includes("--dry");
const limIdx = argv.indexOf("--limit");
const limit = limIdx >= 0 ? Number(argv[limIdx + 1]) : undefined;
const csvPath = argv.find((a) => !a.startsWith("--") && a !== String(limit)) || "C:/Users/negis/Downloads/listings_rows (1).csv";

const R = { apikey: APP_KEY, Authorization: "Bearer " + APP_KEY, "Accept-Profile": "hostiggo_testing_schema" };
const Wr = { ...R, "Content-Type": "application/json", "Content-Profile": "hostiggo_testing_schema" };
const get = async (p) => (await fetch(APP_URL + "/rest/v1/" + p, { headers: R })).json();

function parseCSV(t){const R=[];let r=[],f="",i=0,q=false;while(i<t.length){const c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i+=2;continue;}q=false;i++;continue;}f+=c;i++;continue;}if(c==='"'){q=true;i++;continue;}if(c===","){r.push(f);f="";i++;continue;}if(c==="\r"){i++;continue;}if(c==="\n"){r.push(f);R.push(r);r=[];f="";i++;continue;}f+=c;i++;}if(f.length||r.length){r.push(f);R.push(r);}return R;}
const strip = (s) => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const norm = (s) => strip(s).toLowerCase().replace(/\s+/g, " ").trim();
const key = (state, city) => norm(state) + "|" + norm(city);
const pin = (v) => (Number.isInteger(Number(v)) ? Number(v) : null);

// CSV geography by external id
const m = parseCSV(readFileSync(csvPath, "utf8"));
const h = m[0]; const body = m.slice(1).filter((r) => r.length > 1);
const idi = h.indexOf("id"), ci = h.indexOf("city"), si = h.indexOf("state"), pi = h.indexOf("postal_code");
const geoByExt = {};
for (const r of body) geoByExt[r[idi]] = { city: (r[ci] || "").trim(), state: (r[si] || "").trim(), pincode: r[pi] };

// existing locations -> canonical key map
const locs = await get("locations?select=location_id,state,district&limit=500");
const existing = new Map();
for (const l of locs) { const k = key(l.state, l.district); if (!existing.has(k)) existing.set(k, l.location_id); }

// imported listings
let listings = await get("listings?source=eq.intake_csv&select=listing_id,external_listing_id,location_id&order=listing_id&limit=200");
if (limit) listings = listings.slice(0, limit);

// group by needed location
const needed = new Map();
let noGeo = 0;
for (const l of listings) {
  const g = geoByExt[l.external_listing_id];
  if (!g || !g.state || !g.city) { noGeo++; continue; }
  const k = key(g.state, g.city);
  if (!needed.has(k)) needed.set(k, { state: g.state, city: g.city, pincode: g.pincode, ids: [] });
  needed.get(k).ids.push(l.listing_id);
}

console.log(`\n${dry ? "DRY RUN — no writes" : "LIVE"}   listings: ${listings.length}   distinct locations needed: ${needed.size}   (no-geo: ${noGeo})\n`);

// resolve: reuse existing or create
const keyToLoc = {};
const summary = { reused: 0, created: 0, linked: 0 };
for (const [k, e] of needed) {
  if (existing.has(k)) {
    keyToLoc[k] = existing.get(k);
    console.log(`  reuse   #${keyToLoc[k]}  ${e.state} / ${e.city}  (${e.ids.length} listings)`);
    summary.reused++;
  } else if (dry) {
    keyToLoc[k] = "NEW";
    console.log(`  CREATE  new     ${e.state} / ${e.city}  pin=${pin(e.pincode)}  (${e.ids.length} listings)`);
    summary.created++;
  } else {
    const res = await fetch(APP_URL + "/rest/v1/locations", {
      method: "POST", headers: { ...Wr, Prefer: "return=representation" },
      body: JSON.stringify({ state: e.state, district: e.city, lower_division_name: e.city, lower_division_type: "city", pincode: pin(e.pincode) }),
    });
    if (!res.ok) { console.log(`  ✗ create failed for ${e.state}/${e.city}: ${res.status} ${await res.text()}`); continue; }
    const row = (await res.json())[0];
    keyToLoc[k] = row.location_id; existing.set(k, row.location_id);
    console.log(`  created #${row.location_id}  ${e.state} / ${e.city}  (${e.ids.length} listings)`);
    summary.created++;
  }
}

// link listings (batch per location)
for (const [k, e] of needed) {
  const loc = keyToLoc[k];
  if (dry) { summary.linked += e.ids.length; continue; }
  const res = await fetch(APP_URL + `/rest/v1/listings?listing_id=in.(${e.ids.join(",")})`, {
    method: "PATCH", headers: { ...Wr, Prefer: "return=minimal" },
    body: JSON.stringify({ location_id: loc, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) { console.log(`  ✗ link failed for ${e.state}/${e.city}: ${res.status}`); continue; }
  summary.linked += e.ids.length;
}

console.log("\n──────── summary ────────");
console.log(`  locations reused : ${summary.reused}`);
console.log(`  locations created: ${summary.created}`);
console.log(`  listings linked  : ${summary.linked}`);
if (dry) console.log("\n(dry run — nothing written.)");
