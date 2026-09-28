import { NextRequest, NextResponse } from "next/server";
import { getCachedHotelsTeaser } from "@/lib/services/cached-reference-data";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Used for the homepage's "Popular stays in <city>" teaser rows -- a short
// cache is fine here (unlike search results with real dates/availability,
// this is just a handful of representative listings per location). The
// Cache-Control header alone only helps repeat browser/CDN hits; this was
// still re-querying Supabase on every server-side miss (the dominant cost
// on a cold homepage load, per OPTIMIZATION_PLAN.md). Backed with
// unstable_cache, matching the pattern already used for amenities/locations.
//
// NOTE: deliberately NOT `force-dynamic` -- that directive makes
// Next/Vercel override any manually-set Cache-Control with a hard
// no-cache, which silently defeated this exact header when it was present.
const CACHE_HEADER = "public, s-maxage=30, stale-while-revalidate=120";

export async function GET(req: NextRequest) {
  try {
    // ?ids=1,2,3 -- card data for specific listings (the wishlist page's
    // "Recently viewed" section). Same shape as the wishlist listings query
    // so the client can reuse mapWishlistListing. Only active listings.
    const idsParam = req.nextUrl.searchParams.get("ids");
    if (idsParam !== null) {
      const ids = idsParam
        .split(",")
        .map((s) => s.trim())
        .filter((s) => /^\d+$/.test(s))
        .slice(0, 24)
        .map(Number);
      if (ids.length === 0) return NextResponse.json({ data: [] });
      const { data, error } = await supabaseAdmin
        .from("listing_search_view")
        .select(
          "listing_id, title, price_weekday, avg_rating, review_count, district, state, is_active, listing_media(media_url)",
        )
        .in("listing_id", ids)
        .eq("is_active", true)
        .eq("listing_media.is_cover", true);
      if (error) throw error;
      return NextResponse.json({ data: data ?? [] });
    }

    const locationIdParam = req.nextUrl.searchParams.get("locationId");
    const locationId = locationIdParam ? Number(locationIdParam) : null;
    const limit = Number(req.nextUrl.searchParams.get("limit") ?? 4);
    const data = await getCachedHotelsTeaser(locationId, limit);
    return NextResponse.json({ data }, { headers: { "Cache-Control": CACHE_HEADER } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
