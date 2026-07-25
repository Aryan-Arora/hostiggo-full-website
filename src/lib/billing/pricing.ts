import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { roundPaise, rupeesToPaise } from "./money";
import type { NightlyPriceResolution } from "./types";

export interface DiscountRow {
  id: number;
  listing_id: number;
  discount_type: string;
  percent: number;
  enabled: boolean;
  valid_from?: string | null;
  valid_to?: string | null;
  min_stay_nights?: number | null;
}

function isWeekendNight(dateStr: string): boolean {
  const dow = new Date(dateStr + "T00:00:00Z").getUTCDay();
  return dow === 5 || dow === 6; // Friday or Saturday night
}

/**
 * A discount is applicable only if: it's enabled, the given date falls
 * within its configured validity window (if any is configured -- older
 * rows without valid_from/valid_to are treated as always-valid), and the
 * stay meets its minimum-nights condition (if configured).
 */
export function isDiscountApplicable(
  discount: DiscountRow,
  date: Date,
  stayNights: number,
): boolean {
  if (!discount.enabled) return false;
  if (discount.valid_from && date < new Date(discount.valid_from)) return false;
  if (discount.valid_to && date > new Date(discount.valid_to)) return false;
  if (discount.min_stay_nights && stayNights < discount.min_stay_nights) return false;
  return true;
}

/** Applies the single best (highest-percent) applicable discount, if any -- pure, no I/O. */
export function applyBestDiscount(
  basePricePaise: number,
  discounts: DiscountRow[],
  date: Date,
  stayNights: number,
): { pricePaise: number; discountApplied: NightlyPriceResolution["discountApplied"] } {
  const applicable = discounts.filter((d) => isDiscountApplicable(d, date, stayNights));
  if (applicable.length === 0) {
    return { pricePaise: basePricePaise, discountApplied: null };
  }
  const best = applicable.reduce((a, b) => (b.percent > a.percent ? b : a));
  const pricePaise = roundPaise(basePricePaise * (1 - best.percent / 100));
  return {
    pricePaise,
    discountApplied: { id: best.id, discountType: best.discount_type, percent: best.percent },
  };
}

/**
 * Resolution priority per date: Daily Calendar Price (listing_calendar.price)
 * overrides the Host Base Price (price_weekday/price_weekend, weekend-aware),
 * then the best applicable Host Discount is applied on top. Touches the DB
 * (read-only) -- this is the one function in this module that isn't pure,
 * by necessity (it needs the listing's real stored rates and discounts).
 */
export async function resolveNightlyPrice(
  listingId: number,
  date: Date,
  stayNights: number,
): Promise<NightlyPriceResolution> {
  const dateStr = date.toISOString().slice(0, 10);

  const [{ data: listing, error: listingErr }, { data: calendarRow, error: calErr }, { data: discounts, error: discErr }] =
    await Promise.all([
      supabaseAdmin
        .from("listings")
        .select("price_weekday, price_weekend")
        .eq("listing_id", listingId)
        .maybeSingle(),
      supabaseAdmin
        .from("listing_calendar")
        .select("price, is_available")
        .eq("listing_id", listingId)
        .eq("date", dateStr)
        .maybeSingle(),
      supabaseAdmin.from("listing_discounts").select("*").eq("listing_id", listingId),
    ]);
  if (listingErr) throw listingErr;
  if (calErr) throw calErr;
  if (discErr) throw discErr;
  if (!listing) throw new Error(`Listing ${listingId} not found`);

  let basePricePaise: number;
  let source: NightlyPriceResolution["source"];
  if (calendarRow?.price != null && Number(calendarRow.price) > 0) {
    basePricePaise = rupeesToPaise(Number(calendarRow.price));
    source = "calendar";
  } else {
    const priceWeekday = Number(listing.price_weekday ?? 0);
    const priceWeekend = Number(listing.price_weekend ?? priceWeekday);
    const rupees = isWeekendNight(dateStr) ? priceWeekend : priceWeekday;
    basePricePaise = rupeesToPaise(rupees);
    source = "base";
  }

  const { pricePaise, discountApplied } = applyBestDiscount(
    basePricePaise,
    (discounts ?? []) as DiscountRow[],
    date,
    stayNights,
  );

  return { date: dateStr, pricePaise, source, discountApplied };
}

/** Sums the resolved nightly price (calendar/base + discount) across every night of the stay. */
export async function resolveBookingSubtotal(
  listingId: number,
  checkIn: string,
  checkOut: string,
): Promise<{ subtotalPaise: number; nights: NightlyPriceResolution[] }> {
  const dates: string[] = [];
  const cur = new Date(checkIn + "T00:00:00Z");
  const end = new Date(checkOut + "T00:00:00Z");
  while (cur < end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  const stayNights = dates.length;

  const nights = await Promise.all(
    dates.map((d) => resolveNightlyPrice(listingId, new Date(d + "T00:00:00Z"), stayNights)),
  );
  const subtotalPaise = nights.reduce((sum, n) => sum + n.pricePaise, 0);
  return { subtotalPaise, nights };
}

export interface CouponRow {
  id: number;
  code: string;
  discount_type: "percent" | "fixed";
  value: number;
  active: boolean;
  expires_at: string | null;
  usage_limit: number | null;
  used_count: number;
  min_booking_amount: number | null;
}

export interface CouponValidationResult {
  valid: boolean;
  reason?: string;
  coupon?: CouponRow;
}

/**
 * Coupons apply only at checkout (never on the property card price).
 * Validates: exists, active, not expired, usage limit not exceeded,
 * minimum booking amount satisfied. User-eligibility is intentionally left
 * as a caller-supplied check (e.g. first-booking-only coupons) since that
 * requires booking-history context this function doesn't have.
 */
export async function validateCoupon(
  code: string,
  bookingAmountPaise: number,
): Promise<CouponValidationResult> {
  const { data: coupon, error } = await supabaseAdmin
    .from("hostiggo_coupons")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  if (!coupon) return { valid: false, reason: "Coupon not found." };
  if (!coupon.active) return { valid: false, reason: "Coupon is not active." };
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, reason: "Coupon has expired." };
  }
  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit) {
    return { valid: false, reason: "Coupon usage limit reached." };
  }
  if (coupon.min_booking_amount != null && bookingAmountPaise < rupeesToPaise(coupon.min_booking_amount)) {
    return { valid: false, reason: `Minimum booking amount of ₹${coupon.min_booking_amount} not met.` };
  }
  return { valid: true, coupon: coupon as CouponRow };
}

/** Pure -- applies an already-validated coupon to a subtotal. */
export function applyCoupon(subtotalPaise: number, coupon: CouponRow): number {
  if (coupon.discount_type === "percent") {
    return roundPaise(subtotalPaise * (1 - coupon.value / 100));
  }
  return Math.max(0, roundPaise(subtotalPaise - rupeesToPaise(coupon.value)));
}
