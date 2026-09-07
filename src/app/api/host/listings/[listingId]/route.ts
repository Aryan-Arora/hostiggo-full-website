import { NextRequest, NextResponse } from "next/server";
import { HotelServiceApi } from "@/lib/services/hotel";

export const dynamic = "force-dynamic";

// GET /api/host/listings/[listingId] — media rows (with ids + cover flag) for the
// host manage view. Reads go through the anon client like the other host reads.
export async function GET(
  _req: NextRequest,
  { params }: { params: { listingId: string } },
) {
  try {
    const listingId = Number.parseInt(params.listingId, 10);
    if (!Number.isFinite(listingId)) {
      return NextResponse.json({ error: "Invalid listingId" }, { status: 400 });
    }
    const media = await HotelServiceApi.getListingMedia(listingId);
    return NextResponse.json({ data: media });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Request failed" }, { status: 500 });
  }
}
