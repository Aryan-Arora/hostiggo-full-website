/**
 * Client-safe error message: only unwraps `.message` for real `Error`
 * instances (our own intentional throws, written to be safe and
 * meaningful for end users -- e.g. "You don't have permission to cancel
 * this booking."). Anything else (Supabase's PostgrestError, network
 * errors, etc.) falls back to a generic message instead of leaking raw
 * internals like "column users.promo_notifications does not exist" to
 * the client. Callers should still log the raw `err` server-side so the
 * real reason is visible in server logs.
 */
export function errorMessage(err: unknown, fallback = "Request failed"): string {
  return err instanceof Error ? err.message : fallback;
}
