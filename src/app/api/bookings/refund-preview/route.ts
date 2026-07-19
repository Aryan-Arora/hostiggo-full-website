import { NextRequest, NextResponse } from "next/server";
import { previewCancellationRefund, CancellationValidationError } from "@/lib/billing/cancelBooking";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const bookingId = req.nextUrl.searchParams.get("bookingId");
    const userId = req.nextUrl.searchParams.get("userId");
    if (!bookingId || !userId) {
      return NextResponse.json({ error: "bookingId and userId are required" }, { status: 400 });
    }
    const result = await previewCancellationRefund({
      bookingId: Number(bookingId),
      requestingUserId: userId,
    });
    return NextResponse.json({ data: result });
  } catch (err: any) {
    const status = err instanceof CancellationValidationError ? 400 : 500;
    console.error("[/api/bookings/refund-preview] error:", err?.message);
    return NextResponse.json({ error: err?.message ?? "Request failed" }, { status });
  }
}
