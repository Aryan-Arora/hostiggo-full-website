import { NextRequest, NextResponse } from "next/server";
import { createBooking } from "@/lib/services/admin-writes";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { listingId, userId, startDate, endDate, numAdults, numChildren, addonIds } = body ?? {};
    if (!listingId || !userId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "listingId, userId, startDate and endDate are required" },
        { status: 400 },
      );
    }
    // Note: any `amount` sent by the client is intentionally ignored —
    // createBooking() always recomputes the real charge server-side. Only
    // *which* addonIds were picked comes from the client; their price is
    // always looked up fresh from listing_addons inside createBooking().
    const data = await createBooking({
      listingId: Number(listingId),
      userId: String(userId),
      startDate: String(startDate),
      endDate: String(endDate),
      numAdults: numAdults === undefined ? undefined : Number(numAdults),
      numChildren: numChildren === undefined ? undefined : Number(numChildren),
      addonIds: Array.isArray(addonIds) ? addonIds.map(Number) : undefined,
    });
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("[/api/bookings/reserve] error:", err?.message, err?.code, err?.details, err?.hint);
    return NextResponse.json(
      { error: err?.message || "Request failed", code: err?.code, details: err?.details },
      { status: 500 },
    );
  }
}
