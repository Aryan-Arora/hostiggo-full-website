import { NextResponse } from "next/server";

/**
 * Client-safe error message: only unwraps `.message` for real `Error`
 * instances (our own intentional throws, written to be safe and
 * meaningful for end users -- e.g. "You don't have permission to cancel
 * this booking."). Anything else (Supabase's PostgrestError, network
 * errors, etc.) falls back to a generic message instead of leaking raw
 * internals like "column users.promo_notifications does not exist" to
 * the client. Callers should still log the raw `err` server-side
 * (see `apiError` below) so the real reason is visible in server logs.
 */
export function errorMessage(err: unknown, fallback = "Request failed"): string {
  return err instanceof Error ? err.message : fallback;
}

/**
 * Builds a JSON error response for an API route catch block and always
 * logs the *full* underlying error server-side first. Several routes
 * previously had no server-side logging at all on failure, making
 * production issues undiagnosable from logs.
 */
export function apiError(
  err: unknown,
  context: string,
  fallback = "Request failed",
  status = 500,
): NextResponse {
  console.error(context, err);
  return NextResponse.json({ error: errorMessage(err, fallback) }, { status });
}
