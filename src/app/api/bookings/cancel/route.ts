import { NextRequest, NextResponse } from "next/server";
import { cancelBooking } from "@/lib/services/admin-writes";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { bookingId, reason } = (await req.json()) ?? {};
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }
    const data = await cancelBooking(Number(bookingId), reason ?? null);
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("[/api/bookings/cancel] error:", err?.message, err?.code);
    return NextResponse.json({ error: err?.message ?? "Request failed", code: err?.code }, { status: 500 });
  }
}
