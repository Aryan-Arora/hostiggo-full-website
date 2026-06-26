import { NextRequest, NextResponse } from "next/server";
import { calendarServiceAPI } from "@/lib/services/calendar";

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
