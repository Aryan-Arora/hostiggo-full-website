import { describe, expect, it } from "vitest";
import { calculateBookingInvoice } from "../invoice";
import { calculateRefund } from "../refund";
import { cancellationTimeline, checkInMoment } from "../policyTimeline";

// The dated schedule shown to guests must agree with what calculateRefund
// actually pays out on either side of every cutoff.
const invoice = calculateBookingInvoice({ basePropertyPrice: 8000 });
const checkIn = checkInMoment("2026-12-25", "14:00:00");
const MINUTE = 60_000;
// The timeline's percentages are of the refundable amount: GST and the
// Hostiggo service fee are never refunded (REFUND_SCOPE_NOTE).
const refundableBasePaise =
  invoice.grandTotalPaise -
  (invoice.gstOnPropertyPaise +
    invoice.hostiggoServiceFeePaise +
    invoice.gstOnHostiggoServiceFeePaise +
    invoice.breakfastGstPaise +
    invoice.otherServicesGstPaise);

function refundPaiseAt(policy: "flexible" | "moderate" | "strict", when: Date, strict?: number) {
  return calculateRefund({
    invoice,
    checkIn,
    cancellationTime: when,
    policyConfig: { policy, strictPartialRefundPercent: strict },
  }).refundAmountPaise;
}

describe("checkInMoment", () => {
  it("is the listing's check-in time in IST", () => {
    expect(checkIn.toISOString()).toBe("2026-12-25T08:30:00.000Z");
  });
  it("defaults to 2 PM when the listing has no time", () => {
    expect(checkInMoment("2026-12-25", null).toISOString()).toBe("2026-12-25T08:30:00.000Z");
  });
});

describe.each(["flexible", "moderate", "strict"] as const)("%s timeline matches calculateRefund", (policy) => {
  const steps = cancellationTimeline(policy, checkIn, policy === "strict" ? 0.6 : null);

  it("ends with a no-refund step", () => {
    expect(steps[steps.length - 1].refundPercent).toBe(0);
  });

  for (const [i, step] of steps.entries()) {
    if (!step.until) continue;
    it(`step ${i + 1}: ${step.refundPercent}% just before its cutoff, less right after`, () => {
      const strict = policy === "strict" ? 0.6 : undefined;
      const before = refundPaiseAt(policy, new Date(step.until!.getTime() - MINUTE), strict);
      const after = refundPaiseAt(policy, new Date(step.until!.getTime() + MINUTE), strict);
      expect(before).toBeCloseTo((refundableBasePaise * step.refundPercent) / 100, -1);
      expect(after).toBeLessThan(before);
    });
  }
});
