import { describe, expect, it } from "vitest";
import { calculateBookingInvoice, HOSTIGGO_SERVICE_FEE_RATE } from "../invoice";

describe("calculateBookingInvoice", () => {
  it("computes the ₹10,000 worked example (8% service fee, 18% property GST above ₹7,500)", () => {
    const invoice = calculateBookingInvoice({ basePropertyPrice: 10000 });
    expect(invoice.hostiggoServiceFeePaise).toBe(80000); // ₹800
    expect(invoice.propertyGstRate).toBe(0.18);
    expect(invoice.gstOnPropertyPaise).toBe(180000); // ₹1,800
    expect(invoice.gstOnHostiggoServiceFeePaise).toBe(14400); // ₹144 (18% of ₹800)
    // 10000 + 1800 + 800 + 144 = 12744
    expect(invoice.grandTotalRupees).toBe(12744);
  });

  it("uses 5% property GST at exactly ₹7,500 (threshold is exclusive -- 'above ₹7,500' means >7500)", () => {
    const invoice = calculateBookingInvoice({ basePropertyPrice: 7500 });
    expect(invoice.propertyGstRate).toBe(0.05);
  });

  it("uses 18% property GST just above the ₹7,500 threshold", () => {
    const invoice = calculateBookingInvoice({ basePropertyPrice: 7501 });
    expect(invoice.propertyGstRate).toBe(0.18);
  });

  it("includes breakfast at 5% GST and other services at 18% GST when selected", () => {
    const invoice = calculateBookingInvoice({
      basePropertyPrice: 5000,
      breakfastPrice: 500,
      otherServicesPrice: 1000,
    });
    expect(invoice.breakfastGstPaise).toBe(2500); // 5% of ₹500
    expect(invoice.otherServicesGstPaise).toBe(18000); // 18% of ₹1,000
    expect(invoice.lineItems.map((l) => l.label)).toEqual([
      "Property Price",
      "Hostiggo Service Fee",
      "Breakfast",
      "Other Services",
    ]);
  });

  it("omits breakfast/other-services line items entirely when not selected", () => {
    const invoice = calculateBookingInvoice({ basePropertyPrice: 5000 });
    expect(invoice.lineItems.map((l) => l.label)).toEqual([
      "Property Price",
      "Hostiggo Service Fee",
    ]);
  });

  it("service fee rate is 8%", () => {
    expect(HOSTIGGO_SERVICE_FEE_RATE).toBe(0.08);
  });
});
