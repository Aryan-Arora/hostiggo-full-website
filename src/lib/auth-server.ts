import "server-only";
import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export class UnauthorizedError extends Error {}

/**
 * Verifies the caller's identity from the `Authorization: Bearer <token>`
 * header against Supabase Auth, and returns the real, verified user id.
 *
 * Never trust a `userId` read from a request body or query string for
 * anything security-sensitive (ownership checks, refunds, writes to another
 * user's data) -- it's just a string the client sent and can be anything.
 * `supabase.auth.getUser(token)` calls Supabase's auth server to validate
 * the JWT is genuine and unexpired, so the id this returns can't be spoofed
 * by editing localStorage or crafting a raw request.
 */
export async function getAuthenticatedUserId(req: NextRequest): Promise<string> {
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!token) {
    throw new UnauthorizedError("Missing or malformed Authorization header.");
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    throw new UnauthorizedError("Invalid or expired session.");
  }
  return data.user.id;
}
