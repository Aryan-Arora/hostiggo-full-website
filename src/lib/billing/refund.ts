import { roundPaise, rupeesToPaise } from "./money";
import type { RefundCalculationInput, RefundCalculationResult } from "./types";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const CANCELLATION_POLICY_DEFAULTS = {
  flexibleFullRefundHours: 48,
  moderateFullRefundDays: 5,
  strictPartialRefundDays: 7,
  // NOT specified in the source spec for the Strict policy's "partial
  // refund (per configured %)" case when cancelled >= 7 days out --
  // defaulting to 50% but this is a guess, not a documented rule. Make
  // this configurable per listing/policy and confirm the real number
  // before relying on it in production.
  strictPartialRefundPercent: 0.5,
} as const;

const DEFAULTS = CANCELLATION_POLICY_DEFAULTS;

/**
 * Computes a single final refund amount for the entire booking (no
 * per-add-on/line-item cancellation logic -- add-ons can't be cancelled
 * separately from the booking per the spec). Pure function -- no I/O; the
 * caller resolves the policy, invoice, and cancellation timestamp first.
 */
export function calculateRefund(input: RefundCalculationInput): RefundCalculationResult {
  const { invoice, checkIn, cancellationTime, policyConfig } = input;
  const msUntilCheckIn = checkIn.getTime() - cancellationTime.getTime();
  const hoursUntilCheckIn = msUntilCheckIn / HOUR_MS;
  const daysUntilCheckIn = msUntilCheckIn / DAY_MS;

  const flexibleFullRefundHours =
    policyConfig.flexibleFullRefundHours ?? DEFAULTS.flexibleFullRefundHours;
  const moderateFullRefundDays =
    policyConfig.moderateFullRefundDays ?? DEFAULTS.moderateFullRefundDays;
  const strictPartialRefundDays =
    policyConfig.strictPartialRefundDays ?? DEFAULTS.strictPartialRefundDays;
  const strictPartialRefundPercent =
    policyConfig.strictPartialRefundPercent ?? DEFAULTS.strictPartialRefundPercent;
  const nonRefundableChargesPaise = rupeesToPaise(policyConfig.nonRefundableChargesRupees ?? 0);

  // Taxes and Hostiggo's own fees are never refundable, no matter which
  // policy tier applies or how much of the booking price itself comes
  // back -- only the underlying property-price portion (minus GST) is
  // ever eligible for refund.
  const taxesAndFeesPaise =
    invoice.gstOnPropertyPaise +
    invoice.hostiggoServiceFeePaise +
    invoice.gstOnHostiggoServiceFeePaise +
    invoice.breakfastGstPaise +
    invoice.otherServicesGstPaise;
  const refundableBasePaise = Math.max(0, invoice.grandTotalPaise - taxesAndFeesPaise);

  let refundAmountPaise = 0;
  let refundPercent = 0;
  let reason = "";

  switch (policyConfig.policy) {
    case "flexible": {
      if (hoursUntilCheckIn >= flexibleFullRefundHours) {
        refundAmountPaise = refundableBasePaise;
        refundPercent = invoice.grandTotalPaise > 0 ? refundAmountPaise / invoice.grandTotalPaise : 0;
        reason = `Flexible policy: cancelled ${hoursUntilCheckIn.toFixed(1)}h before check-in (>= ${flexibleFullRefundHours}h) -- full refund excluding taxes and Hostiggo fees.`;
      } else {
        refundAmountPaise = 0;
        refundPercent = 0;
        reason = `Flexible policy: cancelled ${hoursUntilCheckIn.toFixed(1)}h before check-in (< ${flexibleFullRefundHours}h) -- no refund.`;
      }
      break;
    }
    case "moderate": {
      if (daysUntilCheckIn >= moderateFullRefundDays) {
        refundAmountPaise = refundableBasePaise;
        refundPercent = invoice.grandTotalPaise > 0 ? refundAmountPaise / invoice.grandTotalPaise : 0;
        reason = `Moderate policy: cancelled ${daysUntilCheckIn.toFixed(2)}d before check-in (>= ${moderateFullRefundDays}d) -- full refund excluding taxes and Hostiggo fees.`;
      } else {
        refundAmountPaise = roundPaise(Math.max(0, refundableBasePaise - nonRefundableChargesPaise));
        refundPercent = invoice.grandTotalPaise > 0 ? refundAmountPaise / invoice.grandTotalPaise : 0;
        reason = `Moderate policy: cancelled ${daysUntilCheckIn.toFixed(2)}d before check-in (< ${moderateFullRefundDays}d) -- partial refund excluding taxes, Hostiggo fees, and non-refundable charges.`;
      }
      break;
    }
    case "strict": {
      if (daysUntilCheckIn >= strictPartialRefundDays) {
        refundAmountPaise = roundPaise(refundableBasePaise * strictPartialRefundPercent);
        refundPercent = strictPartialRefundPercent;
        reason = `Strict policy: cancelled ${daysUntilCheckIn.toFixed(2)}d before check-in (>= ${strictPartialRefundDays}d) -- ${(strictPartialRefundPercent * 100).toFixed(0)}% partial refund excluding taxes and Hostiggo fees.`;
      } else {
        refundAmountPaise = 0;
        refundPercent = 0;
        reason = `Strict policy: cancelled ${daysUntilCheckIn.toFixed(2)}d before check-in (< ${strictPartialRefundDays}d) -- no refund.`;
      }
      break;
    }
  }

  return {
    policy: policyConfig.policy,
    hoursUntilCheckIn,
    daysUntilCheckIn,
    refundAmountPaise,
    refundAmountRupees: refundAmountPaise / 100,
    refundPercent,
    reason,
  };
}
