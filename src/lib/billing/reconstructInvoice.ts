import { calculateBookingInvoice } from "./invoice";

// Every night between start (inclusive) and end (exclusive), as YYYY-MM-DD.
export function eachDateInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const cur = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");
  while (cur < end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

// Splits a booking's recorded add-ons (booking_addons rows: price + the
// catalogue category stored as `type` at booking time) into the same
// breakfast / other-services buckets validateAndPriceBooking() used when it
// priced the booking, so the reconstructed invoice carries the same add-on
// cost and the same add-on GST lines the guest actually paid.
export function splitBookingAddons(
  rows: { price: number | string | null; type: string | null }[] | null | undefined,
): { breakfastPrice: number; otherServicesPrice: number } {
  let breakfastPrice = 0;
  let otherServicesPrice = 0;
  for (const r of rows ?? []) {
    const price = Number(r.price ?? 0);
    if (r.type?.toLowerCase().includes("breakfast")) breakfastPrice += price;
    else otherServicesPrice += price;
  }
  return { breakfastPrice, otherServicesPrice };
}

// Reconstructs the same subtotal + GST-slab basis createBooking() computed
// at booking time: weekend nights (Fri/Sat) priced at price_weekend,
// everything else at price_weekday, with the check-in night's own rate
// (not the summed total) deciding the 5%/18% GST slab. Refund math must
// match this exactly, or a mixed weekday/weekend stay gets refunded
// against a fictitious flat-rate invoice instead of what the guest
// actually paid.
export function reconstructInvoice(
  startDate: string,
  endDate: string,
  priceWeekday: number,
  priceWeekend: number,
  addonPrices?: { breakfastPrice?: number; otherServicesPrice?: number },
) {
  const nights = eachDateInRange(startDate, endDate);
  const subtotal = nights.reduce((sum, date) => {
    const dow = new Date(date + "T00:00:00Z").getUTCDay();
    const isWeekend = dow === 5 || dow === 6;
    return sum + (isWeekend ? priceWeekend : priceWeekday);
  }, 0);
  const checkInDow = nights.length
    ? new Date(nights[0] + "T00:00:00Z").getUTCDay()
    : 0;
  const gstRateBasisPrice = checkInDow === 5 || checkInDow === 6 ? priceWeekend : priceWeekday;
  return {
    nights,
    invoice: calculateBookingInvoice({
      basePropertyPrice: subtotal,
      gstRateBasisPrice,
      breakfastPrice: addonPrices?.breakfastPrice ?? 0,
      otherServicesPrice: addonPrices?.otherServicesPrice ?? 0,
    }),
  };
}
