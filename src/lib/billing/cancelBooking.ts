import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { calculateRefund } from "./refund";
import { createRazorpayRefund } from "./razorpay";
import { reconstructInvoice } from "./reconstructInvoice";
import type { BookingInvoice, CancellationPolicyConfig, CancellationPolicyType } from "./types";

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
  amount_paise: number | null;
  invoice: BookingInvoice | null;
  razorpay_transfer_id: string | null;
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
    .select("booking_id, listing_id, user_id, start_date, end_date, status_id")
    .eq("booking_id", bookingId)
    .maybeSingle();
  if (bookingErr) throw bookingErr;
  if (!bookingRaw) throw new CancellationValidationError("Booking not found.");
  const booking = bookingRaw as unknown as Pick<
    BookingRow,
    "booking_id" | "listing_id" | "user_id" | "start_date" | "end_date" | "status_id"
  >;
  if (booking.user_id !== requestingUserId) {
    throw new CancellationValidationError("You don't have permission to view this booking.");
  }
  if (booking.status_id !== CONFIRMED_STATUS_ID) {
    throw new CancellationValidationError("Only confirmed bookings can be cancelled.");
  }

  const { data: listing, error: listingErr } = await supabaseAdmin
    .from("listings")
    .select("price_weekday, price_weekend, cancellation_policy, strict_partial_refund_percent")
    .eq("listing_id", booking.listing_id)
    .maybeSingle();
  if (listingErr) throw listingErr;
  if (!listing) throw new CancellationValidationError("Listing not found.");

  const policy = (listing.cancellation_policy ?? "moderate") as CancellationPolicyType;
  const priceWeekday = Number(listing.price_weekday ?? 0);
  const priceWeekend = Number(listing.price_weekend ?? priceWeekday);
  const { invoice } = reconstructInvoice(booking.start_date, booking.end_date, priceWeekday, priceWeekend);
  const refundCalc = calculateRefund({
    invoice,
    checkIn: new Date(booking.start_date + "T00:00:00Z"),
    cancellationTime: new Date(),
    policyConfig: {
      policy,
      strictPartialRefundPercent: listing.strict_partial_refund_percent ?? undefined,
    },
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
      "booking_id, listing_id, host_uuid, user_id, start_date, end_date, status_id, amount, razorpay_payment_id, refund_status, payout_released_at, amount_paise, invoice, razorpay_transfer_id",
    )
    .eq("booking_id", bookingId)
    .maybeSingle();
  if (bookingErr) throw bookingErr;
  if (!bookingRaw) throw new CancellationValidationError("Booking not found.");
  const booking = bookingRaw as unknown as BookingRow;

  // The guest, or the host of this booking, may cancel. A host-initiated cancel
  // always refunds the guest in full -- the cancellation policy only limits what a
  // guest gets back for a change of mind, never for the host backing out.
  let cancelledByHost = false;
  if (booking.user_id !== requestingUserId) {
    const { data: hostRow, error: hostErr } = await supabaseAdmin
      .from("host")
      .select("user_id")
      .eq("host_uuid", booking.host_uuid)
      .maybeSingle();
    if (hostErr) throw hostErr;
    if (hostRow?.user_id !== requestingUserId) {
      throw new CancellationValidationError("You don't have permission to cancel this booking.");
    }
    cancelledByHost = true;
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
      .select("price_weekday, price_weekend, cancellation_policy, strict_partial_refund_percent")
      .eq("listing_id", booking.listing_id)
      .maybeSingle();
    if (listingErr) throw listingErr;
    if (!listing) throw new CancellationValidationError("Listing not found.");

    const policy = (listing.cancellation_policy ?? "moderate") as CancellationPolicyType;
    const priceWeekday = Number(listing.price_weekday ?? 0);
    const priceWeekend = Number(listing.price_weekend ?? priceWeekday);

    // Rebuild the invoice the same way createBooking() did at booking time
    // -- weekend nights at price_weekend, the check-in night's own rate
    // deciding the GST slab -- so the refund calc has the real subtotal and
    // real GST/service-fee line items to exclude, not a flat-rate stand-in.
    // Add-ons are intentionally not itemized here per spec 4.3 (single
    // final amount, no per-line-item cancellation).
    const { nights, invoice } = reconstructInvoice(
      booking.start_date,
      booking.end_date,
      priceWeekday,
      priceWeekend,
    );

    const policyConfig: CancellationPolicyConfig = {
      policy,
      strictPartialRefundPercent: listing.strict_partial_refund_percent ?? undefined,
    };
    // What the guest actually paid, frozen at payment time. Refunds are computed from
    // THIS, not from today's listing prices (which may have changed since) and not
    // from a rebuilt invoice that leaves out add-ons. Bookings that predate the
    // snapshot fall back to the rebuilt invoice.
    const paidPaise =
      booking.amount_paise != null
        ? Number(booking.amount_paise)
        : Math.round(Number(booking.amount ?? 0) * 100);
    const policyRefund = calculateRefund({
      invoice: booking.invoice ?? invoice,
      checkIn: new Date(booking.start_date + "T00:00:00Z"),
      cancellationTime: new Date(),
      policyConfig,
    });
    const refundAmountPaise = cancelledByHost
      ? paidPaise
      : Math.min(policyRefund.refundAmountPaise, paidPaise);
    const refundCalc = {
      ...policyRefund,
      refundAmountPaise,
      refundAmountRupees: refundAmountPaise / 100,
      ...(cancelledByHost
        ? { refundPercent: 100, reason: "Cancelled by the host -- full refund." }
        : {}),
    };

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
          reverseTransfers: !!booking.razorpay_transfer_id,
        });
        razorpayRefundId = refund.id;
        refundStatus = "processed";
      } catch (razorpayErr) {
        refundStatus = "failed";
        console.error("[cancelBookingWithRefund] Razorpay refund failed:", razorpayErr);
        // The booking is about to be marked cancelled either way, so a failed refund
        // must reach a human -- otherwise the guest is cancelled AND unrefunded with
        // nothing anywhere saying so.
        await supabaseAdmin.from("manual_settlement_flags").insert({
          booking_id: bookingId,
          reason: `Refund of ₹${refundCalc.refundAmountRupees} failed at Razorpay -- needs manual refund: ${
            razorpayErr instanceof Error ? razorpayErr.message : "unknown error"
          }`,
          flagged_at: new Date().toISOString(),
        });
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
    if (nights.length) {
      await supabaseAdmin
        .from("listing_calendar")
        .update({ is_available: true, updated_at: new Date().toISOString() })
        .eq("listing_id", booking.listing_id)
        .in("date", nights);
    }

    // In-app notifications (the `notifications` table the app reads).
    // Email/SMS/push still have no provider wired in.
    try {
      const { notify, hostUserId } = await import("@/lib/services/notifications");
      const refundText =
        refundStatus === "processed"
          ? ` A refund of ₹${refundCalc.refundAmountRupees} has been initiated.`
          : refundStatus === "failed"
            ? " Your refund could not be processed automatically; our team will follow up."
            : "";
      const metadata = { bookingId, listingId: booking.listing_id };
      await notify({
        userId: booking.user_id,
        type: "bookings",
        title: cancelledByHost ? "Booking cancelled by host" : "Booking cancelled",
        message: `Booking #${bookingId} was cancelled.${refundText}`,
        metadata,
      });
      const hostUser = await hostUserId(booking.host_uuid);
      if (hostUser && hostUser !== booking.user_id) {
        await notify({
          userId: hostUser,
          type: "bookings",
          title: "Booking cancelled",
          message: `Booking #${bookingId} was cancelled${cancelledByHost ? " by you" : " by the guest"}.`,
          metadata,
        });
      }
    } catch (notifyErr) {
      console.error("[cancelBookingWithRefund] notification failed:", notifyErr);
    }
    // TODO: send email/SMS/push to guest, notify host -- no email/SMS/push
    // provider is wired into this codebase yet.
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
