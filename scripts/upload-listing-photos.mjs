#!/usr/bin/env node
/**
 * STAGE 2 of photo migration: upload the downloaded photos into the app project
 * and link them as listing_media.
 *
 * Reads photo-manifest.json (from download-listing-photos.mjs), then per listing:
 *   - uploads each local file to bucket "homestay photos" at
 *     listings/<listing_id>/<filename>   (matches the app's existing convention)
 *   - inserts listing_media rows (media_url = the public URL; first file = cover)
 *
 * Idempotent: a listing that already has listing_media rows is skipped; storage
 * uploads use upsert so re-running never errors on existing files.
 *
 * RUN:
 *   node upload-listing-photos.mjs --dry-run
 *   node upload-listing-photos.mjs --limit 1        # just the first listing (live)
 *   node upload-listing-photos.mjs                  # all listings
 *
 * Env: APP_URL, APP_KEY, OUT (dir containing photo-manifest.json)
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const APP_URL = process.env.APP_URL, APP_KEY = process.env.APP_KEY;
const OUT = process.env.OUT || join(process.env.USERPROFILE || process.env.HOME || ".", "Downloads", "listing-photos");
const BUCKET = "homestay photos";
const LISTING_CONCURRENCY = 4;
if (!APP_URL || !APP_KEY) { console.error("Missing APP_URL / APP_KEY."); process.exit(1); }

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run") || argv.includes("--dry");
const limIdx = argv.indexOf("--limit");
const limit = limIdx >= 0 ? Number(argv[limIdx + 1]) : undefined;

const admin = createClient(APP_URL, APP_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: "hostiggo_testing_schema" },
});

const mime = (name) => {
  const e = name.toLowerCase().split(".").pop();
  return e === "png" ? "image/png" : e === "webp" ? "image/webp" : "image/jpeg";
};

const manifest = JSON.parse(readFileSync(join(OUT, "photo-manifest.json"), "utf8"));
let work = manifest.filter((m) => m.files.length);
if (limit) work = work.slice(0, limit);

// Idempotency: which of these listings already have media?
const ids = work.map((m) => m.listing_id);
const haveMedia = new Set();
for (let i = 0; i < ids.length; i += 200) {
  const chunk = ids.slice(i, i + 200);
  const { data, error } = await admin.from("listing_media").select("listing_id").in("listing_id", chunk);
  if (error) throw error;
  for (const r of data) haveMedia.add(r.listing_id);
}

console.log(`\n${dryRun ? "DRY RUN — no writes" : "LIVE — " + APP_URL}`);
console.log(`Bucket: "${BUCKET}"   listings with photos: ${work.length}   already-linked: ${[...haveMedia].length}\n`);

const summary = { listings: 0, uploaded: 0, skippedFiles: 0, linked: 0, skippedListings: 0, failed: 0 };

async function processListing(m) {
  const tag = `- listing ${m.listing_id} (${m.files.length} photos)`;
  if (haveMedia.has(m.listing_id)) { console.log(`${tag} — already has media, skip`); summary.skippedListings++; return; }
  if (dryRun) {
    console.log(`${tag} → would upload to listings/${m.listing_id}/ and link (cover=${m.files[0].name})`);
    summary.listings++; summary.uploaded += m.files.length; summary.linked += m.files.length; return;
  }
  try {
    const mediaRows = [];
    for (let i = 0; i < m.files.length; i++) {
      const f = m.files[i];
      const path = `listings/${m.listing_id}/${f.name}`;
      const buf = readFileSync(f.path);
      const { error: upErr } = await admin.storage.from(BUCKET).upload(path, buf, { contentType: mime(f.name), upsert: true });
      if (upErr) throw new Error(`upload ${f.name}: ${upErr.message}`);
      summary.uploaded++;
      const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
      mediaRows.push({ listing_id: m.listing_id, media_url: pub.publicUrl, media_type: "image", is_cover: i === 0 });
    }
    const { error: insErr } = await admin.from("listing_media").insert(mediaRows);
    if (insErr) throw insErr;
    summary.linked += mediaRows.length;
    summary.listings++;
    console.log(`${tag} → uploaded ${mediaRows.length}, linked (cover=${m.files[0].name})`);
  } catch (e) {
    summary.failed++;
    console.log(`${tag}  ✗ ${e?.message ?? e}`);
  }
}

// Pool over listings.
let idx = 0;
async function worker() { while (idx < work.length) { await processListing(work[idx++]); } }
await Promise.all(Array.from({ length: LISTING_CONCURRENCY }, worker));

console.log("\n──────── summary ────────");
console.log(`  listings linked      : ${summary.listings}`);
console.log(`  files uploaded       : ${summary.uploaded}`);
console.log(`  media rows inserted  : ${summary.linked}`);
console.log(`  listings skipped     : ${summary.skippedListings}`);
console.log(`  failed               : ${summary.failed}`);
if (dryRun) console.log("\n(dry run — nothing written.)");
