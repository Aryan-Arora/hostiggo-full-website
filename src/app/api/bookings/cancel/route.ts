import { NextRequest, NextResponse } from "next/server";
import { cancelBooking } from "@/lib/services/admin-writes";
import { getAuthenticatedUserId, UnauthorizedError } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Caller identity comes from the verified session, never the body --
    // otherwise anyone with a user id could cancel that user's bookings.
    const userId = await getAuthenticatedUserId(req);
    const { bookingId, reason } = (await req.json()) ?? {};
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }
    const data = await cancelBooking(Number(bookingId), reason ?? null, userId);
    return NextResponse.json({ data });
  } catch (err: any) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("[/api/bookings/cancel] error:", err?.message, err?.code);
    return NextResponse.json({ error: err?.message ?? "Request failed", code: err?.code }, { status: 500 });
  }
}
