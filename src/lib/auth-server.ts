import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export class UnauthorizedError extends Error {}

const bearerToken = (req: NextRequest): string | null => {
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization");
  return header?.startsWith("Bearer ") ? header.slice(7).trim() || null : null;
};

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
  const token = bearerToken(req);
  if (!token) {
    throw new UnauthorizedError("Missing or malformed Authorization header.");
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    throw new UnauthorizedError("Invalid or expired session.");
  }
  return data.user.id;
}

export const unauthorizedResponse = () =>
  NextResponse.json({ error: "Please sign in again." }, { status: 401 });

export const forbiddenResponse = (message = "You don't have access to this.") =>
  NextResponse.json({ error: message }, { status: 403 });

/**
 * The default for every non-public route: returns the verified user id, or a
 * ready-to-return 401 response.
 *
 *   const userId = await requireUserId(req);
 *   if (userId instanceof NextResponse) return userId;
 */
export async function requireUserId(req: NextRequest): Promise<string | NextResponse> {
  try {
    return await getAuthenticatedUserId(req);
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    throw err;
  }
}

/**
 * For public routes that personalise when signed in (e.g. "is this listing
 * wishlisted"). A missing or invalid token is simply "anonymous", never an
 * error.
 */
export async function optionalUserId(req: NextRequest): Promise<string | null> {
  if (!bearerToken(req)) return null;
  try {
    return await getAuthenticatedUserId(req);
  } catch {
    return null;
  }
}

/**
 * Parses a JSON request body. Malformed JSON (or a non-object body) is a
 * client error -- it returns a 400 instead of letting the parser's own
 * message escape as a 500.
 *
 *   const body = await readJsonBody(req);
 *   if (body instanceof NextResponse) return body;
 */
export async function readJsonBody(
  req: NextRequest,
): Promise<Record<string, any> | NextResponse> {
  try {
    const body = await req.json();
    if (body && typeof body === "object" && !Array.isArray(body)) return body;
  } catch {
    // fall through
  }
  return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
}
