import { NextRequest, NextResponse } from "next/server";
import { validateAndPriceBooking } from "@/lib/services/admin-writes";
import { createRazorpayOrder } from "@/lib/billing/razorpay";

export const dynamic = "force-dynamic";

// No booking is ever inserted here -- this only validates availability,
// computes the real server-side price, and opens a Razorpay order for the
// guest to pay. The booking itself is only ever created by
// finalizeBookingFromRazorpayOrder() once that payment is verified (see
// /api/bookings/confirm-payment and /api/webhooks/razorpay). That also
// means a guest who never completes payment leaves nothing behind to clean
// up -- no pending row, no held calendar nights.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { listingId, userId, startDate, endDate, numAdults, numChildren, addonIds } = body ?? {};
    if (!listingId || !userId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "listingId, userId, startDate and endDate are required" },
        { status: 400 },
      );
    }
    // Basic date sanity -- validateAndPriceBooking() checks availability but
    // assumed a well-formed forward range, so a past or inverted range could
    // still price (and let a guest pay for) a nonsense booking.
    const isoDay = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoDay.test(String(startDate)) || !isoDay.test(String(endDate))) {
      return NextResponse.json(
        { error: "startDate and endDate must be YYYY-MM-DD" },
        { status: 400 },
      );
    }
    const today = new Date().toISOString().slice(0, 10);
    if (String(endDate) <= String(startDate)) {
      return NextResponse.json(
        { error: "endDate must be after startDate" },
        { status: 400 },
      );
    }
    if (String(startDate) < today) {
      return NextResponse.json(
        { error: "startDate cannot be in the past" },
        { status: 400 },
      );
    }
    const nightCount =
      (new Date(String(endDate)).getTime() - new Date(String(startDate)).getTime()) / 86400000;
    if (nightCount > 90) {
      return NextResponse.json(
        { error: "Bookings are limited to 90 nights" },
        { status: 400 },
      );
    }

    const normalizedAddonIds = Array.isArray(addonIds) ? addonIds.slice(0, 20).map(Number) : undefined;
    const normalizedNumAdults =
      numAdults === undefined ? undefined : Math.min(30, Math.max(1, Number(numAdults) || 1));
    const normalizedNumChildren =
      numChildren === undefined ? undefined : Math.min(30, Math.max(0, Number(numChildren) || 0));

    // Note: any `amount` sent by the client is intentionally ignored,
    // validateAndPriceBooking() always recomputes the real charge
    // server-side. Only *which* addonIds were picked comes from the client;
    // their price is always looked up fresh from listing_addons.
    const priced = await validateAndPriceBooking({
      listingId: Number(listingId),
      userId: String(userId),
      startDate: String(startDate),
      endDate: String(endDate),
      numAdults: normalizedNumAdults,
      numChildren: normalizedNumChildren,
      addonIds: normalizedAddonIds,
    });

    // Everything finalizeBookingFromRazorpayOrder() will need to actually
    // create the booking once payment is verified travels here, in the
    // order's own `notes` -- set server-side, never editable by the client
    // that eventually posts razorpay_payment_id back to us.
    const order = await createRazorpayOrder({
      amountPaise: priced.amountPaise,
      receiptId: `booking:${listingId}:${Date.now()}`,
      notes: {
        listingId: String(listingId),
        userId: String(userId),
        startDate: String(startDate),
        endDate: String(endDate),
        ...(normalizedNumAdults !== undefined && { numAdults: String(normalizedNumAdults) }),
        ...(normalizedNumChildren !== undefined && { numChildren: String(normalizedNumChildren) }),
        ...(normalizedAddonIds?.length && { addonIds: JSON.stringify(normalizedAddonIds) }),
      },
    });

    return NextResponse.json({
      data: {
        razorpayOrderId: order.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        amountPaise: priced.amountPaise,
        amountRupees: priced.amountRupees,
        currency: "INR",
      },
    });
  } catch (err: any) {
    console.error("[/api/bookings/reserve] error:", err?.message, err?.code, err?.details, err?.hint);
    return NextResponse.json(
      { error: err?.message || "Request failed", code: err?.code, details: err?.details },
      { status: 500 },
    );
  }
}
