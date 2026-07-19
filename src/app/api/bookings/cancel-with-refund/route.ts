import { NextRequest, NextResponse } from "next/server";
import { cancelBookingWithRefund, CancellationValidationError } from "@/lib/billing/cancelBooking";

export const dynamic = "force-dynamic";

// Deliberately a new, separate endpoint from the existing
// /api/bookings/cancel (a simple status-flip with no refund logic, still
// used by the guest my-memories cancel flow today). This one runs the full
// Section 4 policy-aware refund engine. The two aren't merged in this pass
// so the already-working simple cancel flow can't regress -- switching
// guest-facing cancellation over to this endpoint is a separate, deliberate
// follow-up once the billing migrations have been run and this has been
// tested against a real Razorpay payment.
export async function POST(req: NextRequest) {
  try {
    const { bookingId, userId, reason } = (await req.json()) ?? {};
    if (!bookingId || !userId) {
      return NextResponse.json({ error: "bookingId and userId are required" }, { status: 400 });
    }
    const result = await cancelBookingWithRefund({
      bookingId: Number(bookingId),
      requestingUserId: String(userId),
      reason: reason ?? undefined,
    });
    return NextResponse.json({ data: result });
  } catch (err: any) {
    const status = err instanceof CancellationValidationError ? 400 : 500;
    console.error("[/api/bookings/cancel-with-refund] error:", err?.message);
    return NextResponse.json({ error: err?.message ?? "Request failed" }, { status });
  }
}
