import { NextRequest, NextResponse } from "next/server";
import { HotelServiceApi } from "@/lib/services/hotel";
import { errorMessage } from "@/lib/api-error";

const jsonError = (err: unknown, status = 500) => {
  console.error("[/api/locations] error:", err);
  return NextResponse.json({ error: errorMessage(err, "Request failed") }, { status });
};

// Popular-locations and the default sample are both derived from active
// listing counts, which shift slowly -- safe to CDN-cache briefly. Free-text
// search (?q=) is NOT cached: unbounded query-string space, and staleness
// there would mean showing a destination that no longer matches as the
// user types.
//
// NOTE: deliberately NOT `force-dynamic` -- that directive makes
// Next/Vercel override any manually-set Cache-Control with a hard
// no-cache, which silently defeated this exact header when it was present.
const CACHE_HEADER = "public, s-maxage=60, stale-while-revalidate=300";

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q");
    const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 22));
    const popular = req.nextUrl.searchParams.get("popular") === "1";

    const data = query
      ? await HotelServiceApi.searchLocations(query)
      : popular
        ? await HotelServiceApi.getPopularLocations(limit)
        : await HotelServiceApi.getLocationSample(limit);

    const headers = query ? undefined : { "Cache-Control": CACHE_HEADER };
    return NextResponse.json({ data }, { headers });
  } catch (err) {
    return jsonError(err);
  }
}
