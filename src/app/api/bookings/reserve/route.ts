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
    // Basic date sanity -- createBooking() checks availability but assumed a
    // well-formed forward range, so a past or inverted range could still
    // create (and charge for) a nonsense booking.
    const isoDay = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoDay.test(String(startDate)) || !isoDay.test(String(endDate))) {
      return NextResponse.json(
        { error: "startDate and endDate must be YYYY-MM-DD" },
        { status: 400 },
      );
    }
    const today = new Date().toISOString().slice(0, 10);
    if (String(endDate) <= String(startDate)) {
      return NextResponse.json(
        { error: "endDate must be after startDate" },
        { status: 400 },
      );
    }
    if (String(startDate) < today) {
      return NextResponse.json(
        { error: "startDate cannot be in the past" },
        { status: 400 },
      );
    }
    const nightCount =
      (new Date(String(endDate)).getTime() - new Date(String(startDate)).getTime()) / 86400000;
    if (nightCount > 90) {
      return NextResponse.json(
        { error: "Bookings are limited to 90 nights" },
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
      numAdults: numAdults === undefined ? undefined : Math.min(30, Math.max(1, Number(numAdults) || 1)),
      numChildren: numChildren === undefined ? undefined : Math.min(30, Math.max(0, Number(numChildren) || 0)),
      addonIds: Array.isArray(addonIds) ? addonIds.slice(0, 20).map(Number) : undefined,
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
