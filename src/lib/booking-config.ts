// Booking switches. All three are NEXT_PUBLIC_ so the property page can show
// the right call-to-action up front, and the server routes enforce the same
// values, so the UI can never promise something the API will refuse.

/** Razorpay checkout is live. */
export const PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";

/** Site-wide booking freeze (maintenance, incident). Wins over everything. */
export const BOOKINGS_DISABLED = process.env.NEXT_PUBLIC_BOOKINGS_DISABLED === "true";

/**
 * Only for staging/testing: with payments off, create confirmed bookings
 * without charging. Must be opted into explicitly -- a production deploy that
 * merely forgot NEXT_PUBLIC_PAYMENTS_ENABLED must not hand out free stays.
 */
export const UNPAID_BOOKINGS_ALLOWED =
  !PAYMENTS_ENABLED && process.env.NEXT_PUBLIC_ALLOW_UNPAID_BOOKINGS === "true";

/** Whether a guest can complete a booking right now. */
export const BOOKINGS_OPEN = !BOOKINGS_DISABLED && (PAYMENTS_ENABLED || UNPAID_BOOKINGS_ALLOWED);

/**
 * Today's date in India (yyyy-mm-dd). Stays run on Indian calendar days, so
 * "is this check-in in the past" must not use UTC -- between 00:00 and 05:30
 * IST the UTC date is still yesterday.
 */
export function todayInIndia(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
