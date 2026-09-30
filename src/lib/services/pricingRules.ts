import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { PAYOUT_RATES } from "@/lib/billing/payout";

export type PricingRules = {
  /** Hostiggo's commission on the host payout base, as a fraction (0.05 = 5%). */
  commissionRate: number;
  /** GST rate from pricing_rules, as a fraction (0.18 = 18%). null when no row. */
  gstRate: number | null;
};

// pricing_rules.gst_rate / commission_rate may be stored as a percent (5, 18)
// or a fraction (0.05, 0.18); anything above 1 is read as a percent.
const toFraction = (n: number) => (n > 1 ? n / 100 : n);

let cache: { at: number; value: PricingRules } | null = null;
const TTL_MS = 60_000;

/**
 * Reads the single active pricing_rules row (lowest id). Falls back to the
 * built-in defaults if the table is empty or unreadable so a pricing-table
 * hiccup can never block a payout.
 */
export async function getPricingRules(): Promise<PricingRules> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;

  let value: PricingRules = { commissionRate: PAYOUT_RATES.hostiggoCommission, gstRate: null };
  try {
    const { data, error } = await supabaseAdmin
      .from("pricing_rules")
      .select("gst_rate, commission_rate")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data) {
      const commission = Number(data.commission_rate);
      const gst = Number(data.gst_rate);
      value = {
        commissionRate: Number.isFinite(commission) && commission > 0 ? toFraction(commission) : value.commissionRate,
        gstRate: Number.isFinite(gst) && gst > 0 ? toFraction(gst) : null,
      };
    }
  } catch (err) {
    console.error("[pricingRules] falling back to defaults:", err);
  }
  cache = { at: Date.now(), value };
  return value;
}
