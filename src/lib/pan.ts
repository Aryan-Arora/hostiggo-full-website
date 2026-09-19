// PAN format validation, shared between the KYC form (instant client-side
// feedback) and relied on server-side by /api/verify/pan.

const PAN_RE = /^[A-Z]{5}\d{4}[A-Z]$/;

/** True if `raw` (after stripping whitespace, upper-cased) is a well-formed PAN. */
export function isValidPanNumber(raw: string): boolean {
  return PAN_RE.test(raw.trim().toUpperCase());
}

/** Upper-cases and strips anything that can't appear in a PAN, capped at 10 chars. */
export function formatPanInput(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10);
}
