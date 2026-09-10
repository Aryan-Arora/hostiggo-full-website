#!/usr/bin/env node
/**
 * STAGE 1 of photo migration: download intake listing photos to local disk.
 *
 * Reads the migrated listings from the APP project (source='intake_csv') to get
 * the authoritative external_listing_id -> listing_id mapping, then downloads
 * every photo from the INTAKE project's public `property-photos` bucket
 * (listings/<external_listing_id>/*) into:
 *
 *     <OUT>/<listing_id>/<original-filename>
 *
 * organized by the NEW app listing_id so the upload stage maps 1:1 to
 * `homestay photos/listings/<listing_id>/`. Writes photo-manifest.json.
 *
 * Idempotent: existing local files of the same size are skipped.
 *
 * Env:
 *   APP_URL, APP_KEY         (jhihqmkq… — to read the id mapping)
 *   INTAKE_URL, INTAKE_KEY   (zcln… — to list/download the photos)
 *   OUT                      (output dir; default: Downloads/listing-photos)
 */
import { mkdirSync, existsSync, statSync, writeFileSync, createWriteStream } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";

const APP_URL = process.env.APP_URL, APP_KEY = process.env.APP_KEY;
const INTAKE_URL = process.env.INTAKE_URL, INTAKE_KEY = process.env.INTAKE_KEY;
const OUT = process.env.OUT || join(process.env.USERPROFILE || process.env.HOME || ".", "Downloads", "listing-photos");
const INTAKE_BUCKET = "property-photos";
const CONCURRENCY = 8;

if (!APP_URL || !APP_KEY || !INTAKE_URL || !INTAKE_KEY) { console.error("Missing APP_/INTAKE_ env vars."); process.exit(1); }

const appH = { apikey: APP_KEY, Authorization: "Bearer " + APP_KEY, "Accept-Profile": "hostiggo_testing_schema" };
const inH = { apikey: INTAKE_KEY, Authorization: "Bearer " + INTAKE_KEY };

// 1. Authoritative id mapping from the app DB.
async function listingIdMap() {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(`${APP_URL}/rest/v1/listings?source=eq.intake_csv&select=listing_id,external_listing_id&order=listing_id&limit=1000&offset=${from}`, { headers: appH });
    const rows = await r.json();
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  return out.filter((r) => r.external_listing_id);
}

// 2. List files inside one intake folder.
async function listFolder(extId) {
  const r = await fetch(`${INTAKE_URL}/storage/v1/object/list/${INTAKE_BUCKET}`, {
    method: "POST", headers: { ...inH, "Content-Type": "application/json" },
    body: JSON.stringify({ prefix: `listings/${extId}/`, limit: 1000, sortBy: { column: "name", order: "asc" } }),
  });
  const arr = await r.json();
  return (Array.isArray(arr) ? arr : []).filter((x) => x.id || x.metadata); // files only
}

async function download(extId, file, dest) {
  const size = file.metadata?.size ?? 0;
  if (existsSync(dest) && size && statSync(dest).size === size) return "skip";
  const url = `${INTAKE_URL}/storage/v1/object/public/${INTAKE_BUCKET}/listings/${extId}/${encodeURIComponent(file.name)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${file.name}`);
  await new Promise((resolve, reject) => {
    const ws = createWriteStream(dest);
    Readable.fromWeb(res.body).pipe(ws).on("finish", resolve).on("error", reject);
  });
  return "downloaded";
}

const map = await listingIdMap();
console.log(`Migrated listings in app: ${map.length}`);
mkdirSync(OUT, { recursive: true });

const manifest = [];
let tasks = [];
const stats = { downloaded: 0, skipped: 0, failed: 0, noPhotos: 0, bytes: 0, listings: 0 };

// Build the full task list first (one listFolder call per listing).
for (const { listing_id, external_listing_id } of map) {
  const files = await listFolder(external_listing_id);
  if (!files.length) { stats.noPhotos++; manifest.push({ listing_id, external_listing_id, files: [] }); continue; }
  const dir = join(OUT, String(listing_id));
  mkdirSync(dir, { recursive: true });
  stats.listings++;
  const entry = { listing_id, external_listing_id, files: [] };
  manifest.push(entry);
  for (const f of files) {
    const dest = join(dir, f.name);
    entry.files.push({ name: f.name, size: f.metadata?.size ?? 0, path: dest });
    stats.bytes += f.metadata?.size ?? 0;
    tasks.push({ external_listing_id, f, dest });
  }
}
console.log(`Photos to fetch: ${tasks.length}  (~${(stats.bytes / 1e6).toFixed(1)} MB)   listings without photos: ${stats.noPhotos}\n`);

// Download with a small concurrency pool.
let i = 0, done = 0;
async function worker() {
  while (i < tasks.length) {
    const t = tasks[i++];
    try {
      const r = await download(t.external_listing_id, t.f, t.dest);
      if (r === "downloaded") stats.downloaded++; else stats.skipped++;
    } catch (e) { stats.failed++; console.log("  ✗", t.f.name, e.message); }
    if (++done % 25 === 0) console.log(`  ...${done}/${tasks.length}`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

writeFileSync(join(OUT, "photo-manifest.json"), JSON.stringify(manifest, null, 2));
console.log("\n──────── summary ────────");
console.log(`  listings with photos : ${stats.listings}`);
console.log(`  listings w/o photos  : ${stats.noPhotos}`);
console.log(`  downloaded / skipped : ${stats.downloaded} / ${stats.skipped}`);
console.log(`  failed               : ${stats.failed}`);
console.log(`  total size           : ${(stats.bytes / 1e6).toFixed(1)} MB`);
console.log(`  output dir           : ${OUT}`);
console.log(`  manifest             : ${join(OUT, "photo-manifest.json")}`);
