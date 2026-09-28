import { NextRequest, NextResponse } from "next/server";
import { cancelBooking } from "@/lib/services/admin-writes";
import { getAuthenticatedUserId, UnauthorizedError } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // cancelBooking()'s ownership check (guest or host of the listing) is
    // only as strong as the id it's checking against -- it used to be a
    // bare userId read from the request body, so anyone could pass someone
    // else's real user id and cancel their booking. The caller's identity
    // now comes from their verified Supabase session instead.
    const userId = await getAuthenticatedUserId(req);

    const { bookingId, reason } = (await req.json()) ?? {};
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }
    const data = await cancelBooking(Number(bookingId), reason ?? null, userId);
    return NextResponse.json({ data });
  } catch (err: any) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    }
    console.error("[/api/bookings/cancel] error:", err?.message, err?.code);
    return NextResponse.json({ error: err?.message ?? "Request failed", code: err?.code }, { status: 500 });
  }
}
