import { NextResponse } from "next/server";
import { HotelServiceApi } from "@/lib/services/hotel";
import { errorMessage } from "@/lib/api-error";

export const dynamic = "force-dynamic";

// The amenities list is reference data (23 fixed rows) that essentially
// never changes -- every page load was re-querying Supabase for it on a
// force-dynamic route with no caching at all. CDN-cache the response
// explicitly and boundedly: 60s fresh, then serve stale for up to 5min
// while revalidating in the background. This is unrelated to the earlier
// indefinite-stale-cache bug (src/lib/supabase.ts) -- that was Next's
// automatic fetch cache never invalidating; this is an explicit, bounded,
// self-refreshing Cache-Control on a genuinely near-static endpoint.
const CACHE_HEADER = "public, s-maxage=60, stale-while-revalidate=300";

export async function GET() {
  try {
    const data = await HotelServiceApi.getAmenities();
    return NextResponse.json({ data }, { headers: { "Cache-Control": CACHE_HEADER } });
  } catch (err) {
    console.error("[/api/amenities] error:", err);
    return NextResponse.json(
      { error: errorMessage(err, "Request failed") },
      { status: 500 },
    );
  }
}
