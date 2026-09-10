import { describe, expect, it } from "vitest";
import { reconstructInvoice } from "../reconstructInvoice";
import { calculateBookingInvoice } from "../invoice";

// 2026-08-14 is a Friday -- a 3-night stay Fri/Sat/Sun mixes one weekday
// rate (Sun) with two weekend nights (Fri, Sat), and check-in itself is a
// weekend night.
const START = "2026-08-14";
const END = "2026-08-17"; // exclusive -> nights: 14 (Fri), 15 (Sat), 16 (Sun)
const PRICE_WEEKDAY = 5000;
const PRICE_WEEKEND = 8000; // > 7500 threshold -> 18% GST slab on check-in

describe("reconstructInvoice", () => {
  it("sums each night at its own weekday/weekend rate, not a flat rate", () => {
    const { nights, invoice } = reconstructInvoice(START, END, PRICE_WEEKDAY, PRICE_WEEKEND);
    expect(nights).toEqual(["2026-08-14", "2026-08-15", "2026-08-16"]);
    // 8000 (Fri) + 8000 (Sat) + 5000 (Sun) = 21000, NOT 3 * 5000 = 15000
    // and NOT 3 * 8000 = 24000 -- confirms it isn't just using one flat price.
    expect(invoice.propertyPricePaise).toBe(21000 * 100);
  });

  it("decides the GST slab from the check-in night's own rate, matching createBooking's logic", () => {
    const { invoice } = reconstructInvoice(START, END, PRICE_WEEKDAY, PRICE_WEEKEND);
    // Check-in (Fri) = weekend rate = 8000 > 7500 threshold -> 18%, even
    // though the stay also includes a cheaper weekday night.
    expect(invoice.propertyGstRate).toBe(0.18);
  });

  it("differs from the old flat price_weekday-only reconstruction for a mixed stay", () => {
    const { invoice: real } = reconstructInvoice(START, END, PRICE_WEEKDAY, PRICE_WEEKEND);
    const flatWrong = calculateBookingInvoice({ basePropertyPrice: PRICE_WEEKDAY });
    expect(real.grandTotalPaise).not.toBe(flatWrong.grandTotalPaise);
  });

  it("falls back to price_weekday-equivalent behavior for an all-weekday stay", () => {
    // 2026-08-10 (Mon) to 2026-08-12 (Wed) -- both nights weekday.
    const { invoice } = reconstructInvoice("2026-08-10", "2026-08-12", PRICE_WEEKDAY, PRICE_WEEKEND);
    expect(invoice.propertyPricePaise).toBe(2 * PRICE_WEEKDAY * 100);
    expect(invoice.propertyGstRate).toBe(0.05); // 5000 <= 7500 threshold
  });
});
