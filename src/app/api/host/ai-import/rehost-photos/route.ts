import { NextRequest, NextResponse } from "next/server";
import { mirrorRemoteImageToListingBucket } from "@/lib/services/admin-writes";

export const dynamic = "force-dynamic";

const CONCURRENCY = 4;
const MAX_PHOTOS = 40;

/**
 * Copies AI-imported photos (hosted on the upstream AI-lister service) into
 * our own "homestay photos" bucket. Returns one entry per input URL in the
 * same order -- a string for a successful copy, `null` for one that failed
 * (bad format, too big, fetch error). The client drops the nulls. One bad
 * image never fails the batch.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const urls: unknown = body?.urls;
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "urls[] is required" }, { status: 400 });
    }
    const clean = urls
      .filter((u): u is string => typeof u === "string" && /^https?:\/\//i.test(u))
      .slice(0, MAX_PHOTOS);

    const results: (string | null)[] = new Array(clean.length).fill(null);
    let cursor = 0;

    async function worker() {
      while (cursor < clean.length) {
        const i = cursor++;
        try {
          results[i] = await mirrorRemoteImageToListingBucket(clean[i]);
        } catch (err: any) {
          console.error(`[rehost-photos] ${clean[i]} failed:`, err?.message);
          results[i] = null;
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, clean.length) }, worker));

    return NextResponse.json({ data: { urls: results } });
  } catch (err: any) {
    console.error("[rehost-photos] error:", err?.message);
    return NextResponse.json({ error: err?.message ?? "Failed to re-host photos" }, { status: 500 });
  }
}
