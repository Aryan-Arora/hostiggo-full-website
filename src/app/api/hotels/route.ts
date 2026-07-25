import { NextRequest, NextResponse } from "next/server";
import { HotelServiceApi } from "@/lib/services/hotel";

// Used for the homepage's "Popular stays in <city>" teaser rows -- a short
// cache is fine here (unlike search results with real dates/availability,
// this is just a handful of representative listings per location).
//
// NOTE: deliberately NOT `force-dynamic` -- that directive makes
// Next/Vercel override any manually-set Cache-Control with a hard
// no-cache, which silently defeated this exact header when it was present.
const CACHE_HEADER = "public, s-maxage=30, stale-while-revalidate=120";

export async function GET(req: NextRequest) {
  try {
    const locationId = req.nextUrl.searchParams.get("locationId");
    const limit = Number(req.nextUrl.searchParams.get("limit") ?? 4);
    const data = locationId
      ? await HotelServiceApi.getHotelsByLocationId(Number(locationId), limit)
      : await HotelServiceApi.getHotels();
    return NextResponse.json({ data }, { headers: { "Cache-Control": CACHE_HEADER } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
