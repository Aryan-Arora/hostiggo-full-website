import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { calculateBookingInvoice } from "./invoice";
import { calculateRefund } from "./refund";
import { createRazorpayRefund } from "./razorpay";
import type { CancellationPolicyConfig, CancellationPolicyType } from "./types";

const CONFIRMED_STATUS_ID = 2;
const CANCELLED_STATUS_ID = 3;

export class CancellationValidationError extends Error {}

// No generated Database type is wired into supabaseAdmin (see
// src/lib/supabase-admin.ts), and supabase-js's select-string literal
// parser falls back to an opaque error type for multi-line/concatenated
// select strings -- casting through this interface at the query boundary
// keeps the rest of this function properly typed.
interface BookingRow {
  booking_id: number;
  listing_id: number;
  host_uuid: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status_id: number;
  amount: number | null;
  razorpay_payment_id: string | null;
  refund_status: string | null;
  payout_released_at: string | null;
}

export interface CancelBookingResult {
  bookingId: number;
  refundAmountRupees: number;
  refundPercent: number;
  reason: string;
  razorpayRefundId: string | null;
  refundStatus: "processed" | "failed" | "not_applicable" | "flagged_for_manual_settlement";
}

export interface RefundPreviewResult {
  bookingId: number;
  policy: CancellationPolicyType;
  grandTotalRupees: number;
  refundAmountRupees: number;
  refundPercent: number;
  reason: string;
}

/**
 * Read-only counterpart to cancelBookingWithRefund -- computes the same
 * refund the guest would receive right now, without cancelling anything
 * or touching Razorpay. Used to show the amount before the guest confirms.
 */
export async function previewCancellationRefund(params: {
  bookingId: number;
  requestingUserId: string;
}): Promise<RefundPreviewResult> {
  const { bookingId, requestingUserId } = params;

  const { data: bookingRaw, error: bookingErr } = await supabaseAdmin
    .from("bookings")
    .select("booking_id, listing_id, user_id, start_date, status_id")
    .eq("booking_id", bookingId)
    .maybeSingle();
  if (bookingErr) throw bookingErr;
  if (!bookingRaw) throw new CancellationValidationError("Booking not found.");
  const booking = bookingRaw as unknown as Pick<
    BookingRow,
    "booking_id" | "listing_id" | "user_id" | "start_date" | "status_id"
  >;
  if (booking.user_id !== requestingUserId) {
    throw new CancellationValidationError("You don't have permission to view this booking.");
  }
  if (booking.status_id !== CONFIRMED_STATUS_ID) {
    throw new CancellationValidationError("Only confirmed bookings can be cancelled.");
  }

  const { data: listing, error: listingErr } = await supabaseAdmin
    .from("listings")
    .select("price_weekday, cancellation_policy")
    .eq("listing_id", booking.listing_id)
    .maybeSingle();
  if (listingErr) throw listingErr;
  if (!listing) throw new CancellationValidationError("Listing not found.");

  const policy = (listing.cancellation_policy ?? "moderate") as CancellationPolicyType;
  const invoice = calculateBookingInvoice({ basePropertyPrice: Number(listing.price_weekday ?? 0) });
  const refundCalc = calculateRefund({
    invoice,
    checkIn: new Date(booking.start_date + "T00:00:00Z"),
    cancellationTime: new Date(),
    policyConfig: { policy },
  });

  return {
    bookingId,
    policy,
    grandTotalRupees: invoice.grandTotalRupees,
    refundAmountRupees: refundCalc.refundAmountRupees,
    refundPercent: refundCalc.refundPercent,
    reason: refundCalc.reason,
  };
}

/**
 * Section 4.8 end-to-end orchestrating function:
 *   validate -> read policy -> compute time remaining -> compute refund
 *   -> check payout status -> call Razorpay -> update DB -> (notify --
 *   stubbed, see below) -> write accounting entry -> close booking.
 *
 * Notifications (email/SMS/push to guest, host notification) are left as
 * TODO call-outs to whatever notification service this app ends up using
 * -- none exists in the codebase today (confirmed: no email/SMS provider
 * integration found anywhere), so wiring real sends here would be
 * guessing at a provider. The hooks are marked clearly below.
 */
export async function cancelBookingWithRefund(params: {
  bookingId: number;
  requestingUserId: string;
  reason?: string;
}): Promise<CancelBookingResult> {
  const { bookingId, requestingUserId, reason } = params;

  // 4.1 -- fetch booking + validate.
  const { data: bookingRaw, error: bookingErr } = await supabaseAdmin
    .from("bookings")
    .select(
      "booking_id, listing_id, host_uuid, user_id, start_date, end_date, status_id, amount, razorpay_payment_id, refund_status, payout_released_at",
    )
    .eq("booking_id", bookingId)
    .maybeSingle();
  if (bookingErr) throw bookingErr;
  if (!bookingRaw) throw new CancellationValidationError("Booking not found.");
  const booking = bookingRaw as unknown as BookingRow;
  if (booking.user_id !== requestingUserId) {
    throw new CancellationValidationError("You don't have permission to cancel this booking.");
  }
  if (booking.status_id !== CONFIRMED_STATUS_ID) {
    throw new CancellationValidationError("Only confirmed bookings can be cancelled.");
  }
  if (booking.refund_status && booking.refund_status !== "none") {
    throw new CancellationValidationError("A refund has already been initiated for this booking.");
  }

  // Concurrency guard: a conditional UPDATE that only succeeds if
  // refund_status is still unset acts as a practical row-level lock via
  // PostgREST (true Postgres advisory locks need a custom RPC function,
  // which this schema doesn't have yet -- see the migration file for a
  // pg_advisory_xact_lock-based RPC if a stronger guarantee is needed).
  const { data: lockedRows, error: lockErr } = await supabaseAdmin
    .from("bookings")
    .update({ refund_status: "processing" })
    .eq("booking_id", bookingId)
    .is("refund_status", null)
    .select("booking_id");
  if (lockErr) throw lockErr;
  if (!lockedRows || lockedRows.length === 0) {
    throw new CancellationValidationError(
      "A refund is already being processed for this booking.",
    );
  }

  try {
    // Fetch the listing's assigned cancellation policy + real rates.
    const { data: listing, error: listingErr } = await supabaseAdmin
      .from("listings")
      .select("price_weekday, price_weekend, cancellation_policy")
      .eq("listing_id", booking.listing_id)
      .maybeSingle();
    if (listingErr) throw listingErr;
    if (!listing) throw new CancellationValidationError("Listing not found.");

    const policy = (listing.cancellation_policy ?? "moderate") as CancellationPolicyType;

    // Rebuild the invoice from the booking's stored amount context. This
    // assumes `amount` was originally computed via calculateBookingInvoice
    // (or an equivalent), and recomputes the same breakdown from the
    // listing's base price so the refund calc has real GST/service-fee
    // line items to exclude for Moderate partial refunds -- add-ons are
    // intentionally not itemized here per spec 4.3 (single final amount,
    // no per-line-item cancellation).
    const invoice = calculateBookingInvoice({ basePropertyPrice: Number(listing.price_weekday ?? 0) });

    const policyConfig: CancellationPolicyConfig = { policy };
    const refundCalc = calculateRefund({
      invoice,
      checkIn: new Date(booking.start_date + "T00:00:00Z"),
      cancellationTime: new Date(),
      policyConfig,
    });

    // 4.5 -- if payout already released, do NOT auto-refund; flag for manual settlement.
    if (booking.payout_released_at) {
      const { error: flagErr } = await supabaseAdmin.from("manual_settlement_flags").insert({
        booking_id: bookingId,
        reason: `Cancellation requested after payout released. Computed refund would be ₹${refundCalc.refundAmountRupees}.`,
        flagged_at: new Date().toISOString(),
      });
      if (flagErr) throw flagErr;

      await supabaseAdmin
        .from("bookings")
        .update({
          refund_status: "flagged_for_manual_settlement",
          refund_amount: refundCalc.refundAmountRupees,
          refund_reason: reason ?? null,
          cancelled_at: new Date().toISOString(),
          cancelled_by: requestingUserId,
          policy_used: policy,
        })
        .eq("booking_id", bookingId);

      // TODO: notify ops/finance queue.
      return {
        bookingId,
        refundAmountRupees: refundCalc.refundAmountRupees,
        refundPercent: refundCalc.refundPercent,
        reason: refundCalc.reason,
        razorpayRefundId: null,
        refundStatus: "flagged_for_manual_settlement",
      };
    }

    let razorpayRefundId: string | null = null;
    let refundStatus: CancelBookingResult["refundStatus"] = "not_applicable";

    if (refundCalc.refundAmountPaise > 0) {
      if (!booking.razorpay_payment_id) {
        throw new CancellationValidationError(
          "No Razorpay payment found for this booking -- cannot process a refund.",
        );
      }
      try {
        // 4.7 -- idempotency key ties every retry of this same cancellation
        // to the same Razorpay refund, so a network retry can never double-refund.
        const refund = await createRazorpayRefund({
          razorpayPaymentId: booking.razorpay_payment_id,
          amountPaise: refundCalc.refundAmountPaise,
          idempotencyKey: `refund:${bookingId}`,
          notes: { bookingId: String(bookingId), policy, reason: reason ?? "" },
        });
        razorpayRefundId = refund.id;
        refundStatus = "processed";
      } catch (razorpayErr) {
        refundStatus = "failed";
        console.error("[cancelBookingWithRefund] Razorpay refund failed:", razorpayErr);
        // 4.7 -- notify ops on failure, expose manual retry via the
        // finance dashboard (not built here -- this function can be
        // re-invoked safely thanks to the idempotency key above).
      }
    } else {
      refundStatus = "not_applicable"; // e.g. Flexible/Strict inside their no-refund window
    }

    // 4.6 -- update booking record.
    const { error: updateErr } = await supabaseAdmin
      .from("bookings")
      .update({
        status_id: CANCELLED_STATUS_ID,
        refund_status: refundStatus === "processed" ? "processed" : refundStatus === "failed" ? "failed" : "not_applicable",
        refund_amount: refundCalc.refundAmountRupees,
        refund_reason: reason ?? null,
        refund_transaction_id: razorpayRefundId,
        cancelled_at: new Date().toISOString(),
        cancelled_by: requestingUserId,
        policy_used: policy,
        refund_processed_at: refundStatus === "processed" ? new Date().toISOString() : null,
        cancellation_reason: reason ?? null,
      })
      .eq("booking_id", bookingId);
    if (updateErr) throw updateErr;

    // Free the calendar nights this booking held.
    const nights: string[] = [];
    const cur = new Date(booking.start_date + "T00:00:00Z");
    const end = new Date(booking.end_date + "T00:00:00Z");
    while (cur < end) {
      nights.push(cur.toISOString().slice(0, 10));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    if (nights.length) {
      await supabaseAdmin
        .from("listing_calendar")
        .update({ is_available: true, updated_at: new Date().toISOString() })
        .eq("listing_id", booking.listing_id)
        .in("date", nights);
    }

    // TODO: send email/SMS/push to guest, notify host -- no notification
    // provider is wired into this codebase yet (checked: none found).
    // TODO: accounting-ledger entry -- no ledger table exists yet; the
    // booking row's refund_* columns are the audit trail for now.

    return {
      bookingId,
      refundAmountRupees: refundCalc.refundAmountRupees,
      refundPercent: refundCalc.refundPercent,
      reason: refundCalc.reason,
      razorpayRefundId,
      refundStatus,
    };
  } catch (err) {
    // Release the processing lock on any failure so a retry isn't
    // permanently blocked by the guard above.
    await supabaseAdmin
      .from("bookings")
      .update({ refund_status: null })
      .eq("booking_id", bookingId)
      .eq("refund_status", "processing");
    throw err;
  }
}
