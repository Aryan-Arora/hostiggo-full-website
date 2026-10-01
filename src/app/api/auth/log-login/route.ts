import { NextRequest, NextResponse } from "next/server";
import { recordLoginEvent, type LoginMethod } from "@/lib/services/loginEvents";
import { optionalUserId } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

const VALID_METHODS = new Set<LoginMethod>(["email_otp", "phone_otp", "google"]);

// Email OTP verification (src/lib/api.ts's verifyOtp) and the Google OAuth
// callback (src/app/auth/callback/page.tsx) both establish the Supabase
// session directly client-side rather than through one of our own server
// routes, so there's no single server-side place those two land -- this
// lets the client report a successful sign-in for logging purposes only.
// It intentionally does not touch session/auth state itself.
export async function POST(req: NextRequest) {
  try {
    // The event is recorded against the verified session, never a
    // client-claimed id -- otherwise anyone could plant fake sign-in rows
    // in another user's "Login activity".
    const userId = await optionalUserId(req);
    if (!userId) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    const { method } = await req.json();
    if (!VALID_METHODS.has(method)) {
      return NextResponse.json({ error: "Invalid method" }, { status: 400 });
    }
    await recordLoginEvent(req, userId, method);
    return NextResponse.json({ data: true });
  } catch (err) {
    // Best-effort logging endpoint -- never let this surface as a
    // sign-in-blocking error to the caller.
    console.error("[/api/auth/log-login] error:", err);
    return NextResponse.json({ data: true });
  }
}
