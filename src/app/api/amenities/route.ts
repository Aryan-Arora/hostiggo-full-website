import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { HotelServiceApi } from "@/lib/services/hotel";
import { errorMessage } from "@/lib/api-error";

// The amenities list is reference data (23 fixed rows) that essentially
// never changes -- every page load was re-querying Supabase for it with no
// caching at all. CDN-cache the response explicitly and boundedly: 60s
// fresh, then serve stale for up to 5min while revalidating in the
// background. This is unrelated to the earlier indefinite-stale-cache bug
// (src/lib/supabase.ts) -- that was Next's automatic fetch cache never
// invalidating; this is an explicit, bounded, self-refreshing Cache-Control
// on a genuinely near-static endpoint.
//
// NOTE: deliberately NOT `force-dynamic` here -- that directive makes
// Next/Vercel override any manually-set Cache-Control with a hard
// no-cache, which silently defeated this exact header when it was present.
const CACHE_HEADER = "public, s-maxage=60, stale-while-revalidate=300";

const getAmenities = unstable_cache(
  async () => await HotelServiceApi.getAmenities(),
  ["amenities-all"],
  { revalidate: 3600, tags: ["reference"] },
);

export async function GET() {
  try {
    const data = await getAmenities();
    return NextResponse.json({ data }, { headers: { "Cache-Control": CACHE_HEADER } });
  } catch (err) {
    console.error("[/api/amenities] error:", err);
    return NextResponse.json(
      { error: errorMessage(err, "Request failed") },
      { status: 500 },
    );
  }
}
