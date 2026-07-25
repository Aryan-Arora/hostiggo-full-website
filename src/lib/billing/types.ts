export type CancellationPolicyType = "flexible" | "moderate" | "strict";

export interface BookingInvoiceInput {
  /** Host-entered nightly/stay price for the property portion of this booking, in rupees. */
  basePropertyPrice: number;
  /**
   * Which single night's rate decides the 5%/18% GST slab -- per the
   * declared-tariff GST rule, this is the check-in night's price, NOT the
   * summed multi-night total. Defaults to `basePropertyPrice` when omitted,
   * so single-night callers (property cards, the ₹X/night preview on
   * search results, etc.) are unaffected. Multi-night bookings MUST pass
   * this explicitly -- otherwise a cheap multi-night stay that only adds
   * up to a large total gets bumped into the 18% slab even though every
   * individual night was priced well under the ₹7,500 threshold.
   */
  gstRateBasisPrice?: number;
  /** Optional selected breakfast add-on price, in rupees. */
  breakfastPrice?: number;
  /** Optional selected other-services (airport pickup, decorations, etc.) price, in rupees. */
  otherServicesPrice?: number;
}

export interface BookingInvoiceLineItem {
  label: string;
  amountPaise: number;
  gstRate: number;
  gstAmountPaise: number;
}

export interface BookingInvoice {
  propertyPricePaise: number;
  propertyGstRate: number;
  gstOnPropertyPaise: number;

  hostiggoServiceFeePaise: number;
  hostiggoServiceFeeRate: number;
  gstOnHostiggoServiceFeePaise: number;

  breakfastPricePaise: number;
  breakfastGstRate: number;
  breakfastGstPaise: number;

  otherServicesPricePaise: number;
  otherServicesGstRate: number;
  otherServicesGstPaise: number;

  lineItems: BookingInvoiceLineItem[];
  grandTotalPaise: number;
  grandTotalRupees: number;
}

export interface HostPayoutInput {
  /** Rupees. */
  propertyPrice: number;
  breakfastPrice?: number;
  otherServicesPrice?: number;
}

export interface HostPayoutResult {
  payoutBasePaise: number;
  commissionPaise: number;
  commissionRate: number;
  tcsPaise: number;
  tcsRate: number;
  tdsPaise: number;
  tdsRate: number;
  netHostPayoutPaise: number;
  netHostPayoutRupees: number;
}

export interface CancellationPolicyConfig {
  policy: CancellationPolicyType;
  /** Hours before check-in required for a 100% refund under the Flexible policy. Default 48. */
  flexibleFullRefundHours?: number;
  /** Days before check-in required for a 100% refund under the Moderate policy. Default 5. */
  moderateFullRefundDays?: number;
  /** Days before check-in required for a partial refund under the Strict policy. Default 7. */
  strictPartialRefundDays?: number;
  /**
   * Refund percentage applied under Strict when cancelled >= strictPartialRefundDays before
   * check-in. NOT specified anywhere in the source spec -- defaults to 50% but this is a guess
   * and should be confirmed / made per-listing configurable before relying on it.
   */
  strictPartialRefundPercent?: number;
  /** Any additional non-refundable charges (rupees) configured for this booking/listing, excluded from Moderate partial refunds. */
  nonRefundableChargesRupees?: number;
}

export interface RefundCalculationInput {
  invoice: BookingInvoice;
  checkIn: Date;
  cancellationTime: Date;
  policyConfig: CancellationPolicyConfig;
}

export interface RefundCalculationResult {
  policy: CancellationPolicyType;
  hoursUntilCheckIn: number;
  daysUntilCheckIn: number;
  refundAmountPaise: number;
  refundAmountRupees: number;
  refundPercent: number;
  reason: string;
}

export interface NightlyPriceResolution {
  date: string; // YYYY-MM-DD
  pricePaise: number;
  source: "calendar" | "base";
  discountApplied?: {
    id: number;
    discountType: string;
    percent: number;
  } | null;
}
