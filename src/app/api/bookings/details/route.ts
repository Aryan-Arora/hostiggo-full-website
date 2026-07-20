import { NextRequest, NextResponse } from "next/server";
import { bookingsAPI } from "@/lib/services/bookings";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    const userId = req.nextUrl.searchParams.get("userId");
    if (!id || !userId) {
      return NextResponse.json({ error: "id and userId are required" }, { status: 400 });
    }

    const data = await bookingsAPI.getBookingDetail(id, userId);
    if (!data) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Request failed" },
      { status: 500 },
    );
  }
}
