import { percentOf, roundPaise, rupeesToPaise } from "./money";
import type { HostPayoutInput, HostPayoutResult } from "./types";

export const PAYOUT_RATES = {
  hostiggoCommission: 0.05,
  tcs: 0.01,
  tds: 0.01,
} as const;

/**
 * Host payout is calculated ONLY on Property + Breakfast + Other Services
 * -- excluding the Hostiggo Service Fee and all GST (GST is never host
 * revenue). Pure function -- no I/O.
 *
 * NOTE: implemented exactly as specified (payoutBase - 5% commission - 1%
 * TCS - 1% TDS). For the documented worked example (₹10,000 property,
 * no add-ons), this formula produces ₹9,300, NOT the ₹10,788 stated in
 * the source doc. Per instruction, this is flagged rather than silently
 * reverse-engineered to hit ₹10,788 -- see the skipped assertion in
 * __tests__/payout.test.ts for the exact numbers and why no formula this
 * function could reasonably implement (deductions can only reduce
 * payoutBase, never increase it) reproduces a payout larger than the
 * ₹10,000 base price. This needs the source doc's actual math clarified.
 */
export function calculateHostPayout(input: HostPayoutInput): HostPayoutResult {
  const propertyPricePaise = rupeesToPaise(input.propertyPrice);
  const breakfastPricePaise = rupeesToPaise(input.breakfastPrice ?? 0);
  const otherServicesPricePaise = rupeesToPaise(input.otherServicesPrice ?? 0);

  const payoutBasePaise = propertyPricePaise + breakfastPricePaise + otherServicesPricePaise;

  const commissionPaise = percentOf(payoutBasePaise, PAYOUT_RATES.hostiggoCommission);
  const tcsPaise = percentOf(payoutBasePaise, PAYOUT_RATES.tcs);
  const tdsPaise = percentOf(payoutBasePaise, PAYOUT_RATES.tds);

  const netHostPayoutPaise = roundPaise(payoutBasePaise - commissionPaise - tcsPaise - tdsPaise);

  return {
    payoutBasePaise,
    commissionPaise,
    commissionRate: PAYOUT_RATES.hostiggoCommission,
    tcsPaise,
    tcsRate: PAYOUT_RATES.tcs,
    tdsPaise,
    tdsRate: PAYOUT_RATES.tds,
    netHostPayoutPaise,
    netHostPayoutRupees: netHostPayoutPaise / 100,
  };
}
