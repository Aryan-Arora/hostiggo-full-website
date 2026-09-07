import { NextRequest, NextResponse } from "next/server";
import { HotelServiceApi } from "@/lib/services/hotel";

export const dynamic = "force-dynamic";
// Read listing detail fresh on every request. Without this, Next's Data Cache
// can serve a stale row (e.g. a listing whose location_id was backfilled after
// the first fetch), so edits to a listing wouldn't show until the cache expired.
export const fetchCache = "force-no-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const data = await HotelServiceApi.getHotelDetail(params.id);
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
