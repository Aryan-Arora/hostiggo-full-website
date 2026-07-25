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

describe("calculateRefund -- Flexible policy (48h boundary)", () => {
  const policyConfig: CancellationPolicyConfig = { policy: "flexible" };

  it("full refund at exactly 48 hours before check-in", () => {
    const result = calculateRefund({
      invoice,
      checkIn: CHECK_IN,
      cancellationTime: cancelAt(48 * HOUR_MS),
      policyConfig,
    });
    expect(result.refundAmountPaise).toBe(refundableBasePaise);
  });

  it("full refund just outside the window (48h 1min before)", () => {
    const result = calculateRefund({
      invoice,
      checkIn: CHECK_IN,
      cancellationTime: cancelAt(48 * HOUR_MS + 60_000),
      policyConfig,
    });
    expect(result.refundAmountPaise).toBe(refundableBasePaise);
  });

  it("no refund just inside the window (47h 59min before)", () => {
    const result = calculateRefund({
      invoice,
      checkIn: CHECK_IN,
      cancellationTime: cancelAt(48 * HOUR_MS - 60_000),
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

  it("partial refund (still excludes taxes and Hostiggo fees) just inside 5 days", () => {
    const result = calculateRefund({
      invoice,
      checkIn: CHECK_IN,
      cancellationTime: cancelAt(5 * DAY_MS - 60_000),
      policyConfig,
    });
    expect(result.refundAmountPaise).toBe(refundableBasePaise);
    expect(result.refundAmountPaise).toBeLessThan(invoice.grandTotalPaise);
  });

  it("partial refund additionally excludes configured non-refundable charges", () => {
    const result = calculateRefund({
      invoice,
      checkIn: CHECK_IN,
      cancellationTime: cancelAt(1 * DAY_MS),
      policyConfig: { ...policyConfig, nonRefundableChargesRupees: 500 },
    });
    const expected = refundableBasePaise - 50_000;
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
