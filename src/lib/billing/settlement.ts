/**
 * Razorpay settles captured payments on a T+2 *working day* schedule, paid
 * out by about 1:00 PM IST -- e.g. a payment captured Saturday 19 Sep is
 * "to be deposited by Tue 22 Sep, 1:00 PM" on the Razorpay dashboard.
 *
 * This is an estimate for display only: it skips weekends but not bank
 * holidays, and the real date is whatever Razorpay's own timeline says.
 * Pure function -- safe on both server and client.
 */
export const SETTLEMENT_WORKING_DAYS = 2;

const IST_OFFSET_MS = 330 * 60_000;

export function expectedSettlementDate(paidAt: string | Date | null | undefined): Date | null {
  if (!paidAt) return null;
  const paid = new Date(paidAt);
  if (Number.isNaN(paid.getTime())) return null;

  // Work in IST so "Saturday evening" is Saturday for the host, not UTC.
  const ist = new Date(paid.getTime() + IST_OFFSET_MS);
  let added = 0;
  while (added < SETTLEMENT_WORKING_DAYS) {
    ist.setUTCDate(ist.getUTCDate() + 1);
    const day = ist.getUTCDay(); // 0 = Sun, 6 = Sat
    if (day !== 0 && day !== 6) added += 1;
  }
  // 1:00 PM IST on that day.
  ist.setUTCHours(13, 0, 0, 0);
  return new Date(ist.getTime() - IST_OFFSET_MS);
}

export function formatSettlementDate(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  });
}
