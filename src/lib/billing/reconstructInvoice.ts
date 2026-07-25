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
    invoice: calculateBookingInvoice({ basePropertyPrice: subtotal, gstRateBasisPrice }),
  };
}
