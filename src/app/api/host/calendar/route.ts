import { NextRequest, NextResponse } from "next/server";
import { calendarServiceAPI } from "@/lib/services/calendar";
import { upsertCalendarDay } from "@/lib/services/admin-writes";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const listingId = req.nextUrl.searchParams.get("listingId");
    const start = req.nextUrl.searchParams.get("start");
    const end = req.nextUrl.searchParams.get("end");

    if (!listingId || !start || !end) {
      return NextResponse.json(
        { error: "listingId, start and end are required" },
        { status: 400 },
      );
    }

    const id = Number(listingId);
    const [entries, bookings] = await Promise.all([
      calendarServiceAPI.fetchCalendarEntries(id, start, end),
      calendarServiceAPI.fetchBookingsForListing(id, start, end),
    ]);

    return NextResponse.json({ data: { entries, bookings } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Request failed" },
      { status: 500 },
    );
  }
}

// Update a single day's rate / availability for a listing.
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { listingId, date, price, isAvailable, userId } = body ?? {};
    if (!listingId || !date || !userId) {
      return NextResponse.json(
        { error: "listingId, date and userId are required" },
        { status: 400 },
      );
    }
    if (price !== undefined && price !== null && (Number(price) < 0 || Number(price) > 10000000)) {
      return NextResponse.json({ error: "price out of range" }, { status: 400 });
    }
    const data = await upsertCalendarDay({
      listingId: Number(listingId),
      date: String(date),
      price: price === undefined || price === null ? undefined : Number(price),
      isAvailable: typeof isAvailable === "boolean" ? isAvailable : undefined,
      requestingUserId: String(userId),
    });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Request failed" },
      { status: 500 },
    );
  }
}
