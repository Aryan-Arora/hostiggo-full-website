// Display formatters shared by guest and host screens.

/**
 * "₹4,577.60" / "₹4,000" -- rupees with Indian digit grouping. Whole amounts
 * drop the paise; fractional ones always show two decimals (never "₹57.6").
 */
export function formatINR(rupees: number | string | null | undefined): string {
  const n = Number(rupees ?? 0);
  if (!Number.isFinite(n)) return "₹0";
  const fractional = Math.round(n * 100) % 100 !== 0;
  return `₹${n.toLocaleString("en-IN", {
    minimumFractionDigits: fractional ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

/** Same as formatINR but "Rs." -- for PDFs, whose built-in fonts lack "₹". */
export function formatINRPlain(rupees: number | string | null | undefined): string {
  return formatINR(rupees).replace("₹", "Rs. ");
}

/** "14:00:00" / "14:00" -> "2:00 PM". Returns null for anything unparseable. */
export function formatTime12h(value: string | null | undefined): string | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(value ?? "").trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = m[2];
  if (h > 23 || Number(min) > 59) return null;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${min} ${suffix}`;
}

/** yyyy-mm-dd parsed as a calendar day (no timezone shift). */
export function parseISODay(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** "Fri, 25 Dec 2026" */
export function formatStayDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return parseISODay(iso).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "March 2026" for a review/post timestamp; "" when unparseable. */
export function reviewMonth(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

/** "1 night" / "3 nights", "1 adult" / "2 adults" */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
