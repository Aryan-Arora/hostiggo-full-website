import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpayWebhookSignature } from "@/lib/billing/razorpay";
import { finalizeBookingFromRazorpayOrder } from "@/lib/services/admin-writes";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// Configure this URL as a webhook in the Razorpay dashboard, subscribed to
// at least `payment.captured` (and `payment.failed` for visibility -- it's
// a no-op here, see below). This is the backup confirmation path: the
// browser-side checkout callback (/api/bookings/confirm-payment) can simply
// never fire -- guest closes the tab, phone loses signal, browser crashes --
// right after a payment that Razorpay itself considers successful. Without
// this, that guest paid and has no booking. Both paths converge on the same
// finalizeBookingFromRazorpayOrder(), which is idempotent on
// razorpay_payment_id, so whichever fires first wins and the other is a
// harmless no-op.
export async function POST(req: NextRequest) {
  // Must read the raw body before any JSON parsing -- verification is over
  // the exact bytes Razorpay sent and signed; parsing then re-stringifying
  // can reorder keys and silently break the signature check.
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing X-Razorpay-Signature header" }, { status: 400 });
  }

  let verified: boolean;
  try {
    verified = verifyRazorpayWebhookSignature(rawBody, signature);
  } catch (err: any) {
    console.error("[/api/webhooks/razorpay] verification error:", err?.message);
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }
  if (!verified) {
    console.error("[/api/webhooks/razorpay] signature mismatch -- rejecting");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const event = payload?.event;

  if (event === "payment.captured") {
    const payment = payload?.payload?.payment?.entity;
    const orderId = payment?.order_id;
    const paymentId = payment?.id;
    if (!orderId || !paymentId) {
      console.error("[/api/webhooks/razorpay] payment.captured missing order_id/payment id");
      return NextResponse.json({ error: "Malformed payment.captured payload" }, { status: 400 });
    }
    try {
      await finalizeBookingFromRazorpayOrder({ orderId, paymentId });
    } catch (err: any) {
      // Returning 500 tells Razorpay to retry the webhook -- correct for a
      // transient DB error, but a genuine "dates no longer available"
      // rejection (already refunded inside finalizeBookingFromRazorpayOrder)
      // would just retry forever for no benefit. Log either way; only the
      // former is worth Razorpay's automatic retry.
      console.error(
        `[/api/webhooks/razorpay] finalize failed for payment ${paymentId}:`,
        err?.message,
      );
      return NextResponse.json({ error: err?.message || "Finalize failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (event === "payment.failed") {
    // Nothing to do -- no booking was ever created for an unpaid order (see
    // /api/bookings/reserve), so a failed payment leaves nothing to clean
    // up. Logged for visibility only.
    console.log("[/api/webhooks/razorpay] payment.failed:", payload?.payload?.payment?.entity?.id);
    return NextResponse.json({ ok: true });
  }

  // Route split-payment lifecycle (see createHostTransferForBooking in
  // admin-writes.ts, which creates the transfer this event confirms).
  // Idempotent by construction: both are plain status/id updates keyed by
  // razorpay_transfer_id, so a duplicate webhook delivery just writes the
  // same value again rather than creating anything new.
  if (event === "transfer.processed") {
    const transfer = payload?.payload?.transfer?.entity;
    if (!transfer?.id) {
      console.error("[/api/webhooks/razorpay] transfer.processed missing transfer id");
      return NextResponse.json({ error: "Malformed transfer.processed payload" }, { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from("bookings")
      .update({ transfer_status: "processed" })
      .eq("razorpay_transfer_id", transfer.id);
    if (error) {
      console.error("[/api/webhooks/razorpay] failed to update transfer_status:", error);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (event === "settlement.processed") {
    const settlement = payload?.payload?.settlement?.entity;
    // A settlement can cover multiple transfers; Razorpay's payload for
    // Route settlements includes which transfer(s) it settles -- but the
    // exact field name for that isn't confirmed against a real payload
    // (never tested against live Route settlements, see razorpayRoute.ts).
    // Logged so a real webhook delivery can be inspected before this branch
    // is trusted to update the right booking(s).
    console.log("[/api/webhooks/razorpay] settlement.processed (not yet wired to a booking):", settlement);
    return NextResponse.json({ ok: true });
  }

  // Any other subscribed event (refund.processed, etc.) -- acknowledge so
  // Razorpay doesn't retry, nothing to act on here yet.
  return NextResponse.json({ ok: true });
}
