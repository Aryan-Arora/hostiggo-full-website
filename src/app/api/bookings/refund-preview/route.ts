import { NextRequest, NextResponse } from "next/server";
import { previewCancellationRefund, CancellationValidationError } from "@/lib/billing/cancelBooking";
import { getAuthenticatedUserId, UnauthorizedError } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Same reasoning as /api/bookings/cancel-with-refund -- this exposes a
    // specific booking's refund amount, so the caller's identity has to come
    // from a verified session, not a query-string userId anyone could set.
    const requestingUserId = await getAuthenticatedUserId(req);

    const bookingId = req.nextUrl.searchParams.get("bookingId");
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }
    const result = await previewCancellationRefund({
      bookingId: Number(bookingId),
      requestingUserId,
    });
    return NextResponse.json({ data: result });
  } catch (err: any) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    const status = err instanceof CancellationValidationError ? 400 : 500;
    console.error("[/api/bookings/refund-preview] error:", err?.message);
    return NextResponse.json({ error: err?.message ?? "Request failed" }, { status });
  }
}
