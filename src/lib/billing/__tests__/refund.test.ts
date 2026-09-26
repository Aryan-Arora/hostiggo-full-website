import { describe, expect, it } from "vitest";
import { calculateBookingInvoice } from "../invoice";
import { calculateRefund } from "../refund";
import type { CancellationPolicyConfig } from "../types";

const invoice = calculateBookingInvoice({ basePropertyPrice: 10000 }); // grandTotal = ₹13,334
const CHECK_IN = new Date("2026-08-15T00:00:00Z");
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// Taxes and Hostiggo's own fees are never refundable -- only the
// property-price portion (excluding its GST) is ever eligible.
const refundableBasePaise =
  invoice.grandTotalPaise -
  (invoice.gstOnPropertyPaise +
    invoice.hostiggoServiceFeePaise +
    invoice.gstOnHostiggoServiceFeePaise +
    invoice.breakfastGstPaise +
    invoice.otherServicesGstPaise);

function cancelAt(msBeforeCheckIn: number): Date {
  return new Date(CHECK_IN.getTime() - msBeforeCheckIn);
}

describe("calculateRefund -- Flexible policy (24h boundary, matches Airbnb's Flexible tier)", () => {
  const policyConfig: CancellationPolicyConfig = { policy: "flexible" };

  it("full refund at exactly 24 hours before check-in", () => {
    const result = calculateRefund({
      invoice,
      checkIn: CHECK_IN,
      cancellationTime: cancelAt(24 * HOUR_MS),
      policyConfig,
    });
    expect(result.refundAmountPaise).toBe(refundableBasePaise);
  });

  it("full refund just outside the window (24h 1min before)", () => {
    const result = calculateRefund({
      invoice,
      checkIn: CHECK_IN,
      cancellationTime: cancelAt(24 * HOUR_MS + 60_000),
      policyConfig,
    });
    expect(result.refundAmountPaise).toBe(refundableBasePaise);
  });

  it("no refund just inside the window (23h 59min before)", () => {
    const result = calculateRefund({
      invoice,
      checkIn: CHECK_IN,
      cancellationTime: cancelAt(24 * HOUR_MS - 60_000),
      policyConfig,
    });
    expect(result.refundAmountPaise).toBe(0);
    expect(result.refundPercent).toBe(0);
  });
});

describe("calculateRefund -- Moderate policy (5 day boundary)", () => {
  const policyConfig: CancellationPolicyConfig = { policy: "moderate" };

  it("full refund at exactly 5 days before check-in", () => {
    const result = calculateRefund({
      invoice,
      checkIn: CHECK_IN,
      cancellationTime: cancelAt(5 * DAY_MS),
      policyConfig,
    });
    expect(result.refundAmountPaise).toBe(refundableBasePaise);
  });

  // Previously asserted a 100% refund here (the bug: nonRefundableChargesRupees
  // is never set, so "partial" == full). Now 50% per Airbnb's Moderate.
  it("50% partial refund just inside 5 days", () => {
    const result = calculateRefund({
      invoice,
      checkIn: CHECK_IN,
      cancellationTime: cancelAt(5 * DAY_MS - 60_000),
      policyConfig,
    });
    expect(result.refundAmountPaise).toBe(Math.round(refundableBasePaise * 0.5));
    expect(result.refundPercent).toBe(0.5);
  });

  it("exactly 50% (not 100%) at 3 days before check-in", () => {
    const result = calculateRefund({
      invoice,
      checkIn: CHECK_IN,
      cancellationTime: cancelAt(3 * DAY_MS),
      policyConfig,
    });
    expect(result.refundAmountPaise).toBe(Math.round(refundableBasePaise * 0.5));
    expect(result.refundAmountPaise).not.toBe(refundableBasePaise);
  });

  it("50% still applies at exactly 24 hours before check-in", () => {
    const result = calculateRefund({
      invoice,
      checkIn: CHECK_IN,
      cancellationTime: cancelAt(24 * HOUR_MS),
      policyConfig,
    });
    expect(result.refundAmountPaise).toBe(Math.round(refundableBasePaise * 0.5));
  });

  it("no refund at 12 hours before check-in", () => {
    const result = calculateRefund({
      invoice,
      checkIn: CHECK_IN,
      cancellationTime: cancelAt(12 * HOUR_MS),
      policyConfig,
    });
    expect(result.refundAmountPaise).toBe(0);
    expect(result.refundPercent).toBe(0);
  });

  // Previously expected refundableBase - ₹500; the optional deduction now
  // applies on top of the 50% partial refund.
  it("partial refund additionally deducts configured non-refundable charges", () => {
    const result = calculateRefund({
      invoice,
      checkIn: CHECK_IN,
      cancellationTime: cancelAt(1 * DAY_MS),
      policyConfig: { ...policyConfig, nonRefundableChargesRupees: 500 },
    });
    const expected = Math.round(refundableBasePaise * 0.5) - 50_000;
    expect(result.refundAmountPaise).toBe(expected);
  });
});

describe("calculateRefund -- Strict policy (7 day boundary)", () => {
  const policyConfig: CancellationPolicyConfig = { policy: "strict" };

  it("partial refund (default 50%, flagged as unconfirmed) at exactly 7 days before check-in", () => {
    const result = calculateRefund({
      invoice,
      checkIn: CHECK_IN,
      cancellationTime: cancelAt(7 * DAY_MS),
      policyConfig,
    });
    expect(result.refundPercent).toBe(0.5);
    expect(result.refundAmountPaise).toBe(Math.round(refundableBasePaise * 0.5));
  });

  it("respects a configured strictPartialRefundPercent override", () => {
    const result = calculateRefund({
      invoice,
      checkIn: CHECK_IN,
      cancellationTime: cancelAt(7 * DAY_MS),
      policyConfig: { ...policyConfig, strictPartialRefundPercent: 0.3 },
    });
    expect(result.refundPercent).toBe(0.3);
  });

  it("no refund just inside 7 days", () => {
    const result = calculateRefund({
      invoice,
      checkIn: CHECK_IN,
      cancellationTime: cancelAt(7 * DAY_MS - 60_000),
      policyConfig,
    });
    expect(result.refundAmountPaise).toBe(0);
  });
});

describe("calculateRefund -- bookings with add-ons", () => {
  const withAddons = calculateBookingInvoice({
    basePropertyPrice: 10000,
    breakfastPrice: 1000,
    otherServicesPrice: 2000,
  });
  const stayOnly = calculateBookingInvoice({ basePropertyPrice: 10000 });

  it("Flexible 24h+ full refund includes add-on price but excludes add-on GST", () => {
    const result = calculateRefund({
      invoice: withAddons,
      checkIn: CHECK_IN,
      cancellationTime: cancelAt(48 * HOUR_MS),
      policyConfig: { policy: "flexible" },
    });
    const stayOnlyRefund = calculateRefund({
      invoice: stayOnly,
      checkIn: CHECK_IN,
      cancellationTime: cancelAt(48 * HOUR_MS),
      policyConfig: { policy: "flexible" },
    }).refundAmountPaise;
    // Add-on prices (₹1,000 + ₹2,000) come back in full on top of the stay refund.
    expect(result.refundAmountPaise).toBe(stayOnlyRefund + 300_000);
    expect(withAddons.breakfastGstPaise).toBeGreaterThan(0);
    expect(result.refundAmountPaise).toBe(
      withAddons.grandTotalPaise -
        (withAddons.gstOnPropertyPaise +
          withAddons.hostiggoServiceFeePaise +
          withAddons.gstOnHostiggoServiceFeePaise +
          withAddons.breakfastGstPaise +
          withAddons.otherServicesGstPaise),
    );
  });
});
