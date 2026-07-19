import { describe, expect, it } from "vitest";
import { calculateHostPayout } from "../payout";

describe("calculateHostPayout", () => {
  it("implements the spec's formula exactly: payoutBase - 5% commission - 1% TCS - 1% TDS", () => {
    const result = calculateHostPayout({ propertyPrice: 10000 });
    expect(result.payoutBasePaise).toBe(1_000_000); // ₹10,000
    expect(result.commissionPaise).toBe(50_000); // ₹500 (5%)
    expect(result.tcsPaise).toBe(10_000); // ₹100 (1%)
    expect(result.tdsPaise).toBe(10_000); // ₹100 (1%)
    // 10000 - 500 - 100 - 100 = 9300
    expect(result.netHostPayoutRupees).toBe(9300);
  });

  /**
   * FLAGGED DISCREPANCY -- do not "fix" this test to pass without
   * confirming the real formula with the source doc's author first.
   *
   * The source spec's worked example states net payout = ₹10,788 for a
   * ₹10,000 property price with no add-ons. The formula as literally
   * specified in Section 3 (payoutBase - 5% - 1% - 1% = 93% of
   * payoutBase) can only ever produce a number <= payoutBase, since every
   * term being subtracted is non-negative. ₹10,788 > ₹10,000, so no
   * version of "subtract percentages of payoutBase" reproduces it --
   * something is being *added* in the real calculation that the doc
   * didn't state (GST remitted back to the host? A different payoutBase
   * that already includes the service fee or GST? A sign error in the
   * doc itself?). Implementing the formula as specified (see the test
   * above, which passes) rather than reverse-engineering unstated math to
   * force this number, per instruction.
   */
  it.skip("[NEEDS CLARIFICATION] source doc's ₹10,788 example -- does not reproduce with the stated formula", () => {
    const result = calculateHostPayout({ propertyPrice: 10000 });
    expect(result.netHostPayoutRupees).toBe(10788);
  });

  it("includes breakfast and other-services prices in the payout base", () => {
    const result = calculateHostPayout({
      propertyPrice: 10000,
      breakfastPrice: 500,
      otherServicesPrice: 1000,
    });
    expect(result.payoutBasePaise).toBe(1_150_000); // ₹11,500
  });
});
