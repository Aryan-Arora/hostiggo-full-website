import { NextRequest, NextResponse } from "next/server";
import { bookingsAPI } from "@/lib/services/bookings";
import { errorMessage } from "@/lib/api-error";
import { getAuthenticatedUserId, UnauthorizedError } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    // The caller's own verified identity, never a query param -- this
    // payload includes the guest's name and phone, so a client-claimed
    // userId would let anyone view any booking just by knowing its id.
    const userId = await getAuthenticatedUserId(req);

    const data = await bookingsAPI.getBookingDetail(id, userId);
    if (!data) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("[/api/bookings/details] error:", err);
    return NextResponse.json(
      { error: errorMessage(err, "Request failed") },
      { status: 500 },
    );
  }
}
