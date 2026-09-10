import { NextRequest, NextResponse } from "next/server";
import { authApi } from "@/lib/services/auth";
import { ensureProfile } from "@/lib/services/ensureProfile";
import { recordLoginEvent } from "@/lib/services/loginEvents";

export const dynamic = "force-dynamic";

// Email + password sign-in/sign-up, alongside the existing OTP flow --
// mirrors /api/auth/otp's response shape (user/session/profile) so the
// client can reuse the same post-login handling (setStoredSession + signIn).
export async function POST(req: NextRequest) {
  try {
    const { action, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    if (action === "signup") {
      const { data, error } = await authApi.signUpWithPassword(email, password);
      if (error) {
        console.error("[password auth] sign-up error:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      const user = data?.user;
      const session = data?.session;
      if (!user) {
        return NextResponse.json({ error: "Sign-up failed" }, { status: 400 });
      }

      // If email confirmation is required, Supabase returns a user but no
      // session -- the account exists, but can't be logged into yet.
      if (!session) {
        return NextResponse.json({
          data: { user, session: null, profile: null },
          message: "Check your email to confirm your account before signing in.",
        });
      }

      const profile = await ensureProfile(user);
      await recordLoginEvent(req, user.id, "password");
      return NextResponse.json({ data: { user, session, profile } });
    }

    if (action === "signin") {
      const { data, error } = await authApi.signInWithPassword(email, password);
      if (error) {
        console.error("[password auth] sign-in error:", error);
        return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
      }

      const user = data?.user;
      const session = data?.session;
      if (!user || !session) {
        return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
      }

      const profile = await ensureProfile(user);

      // Same belt-and-suspenders deactivation check as /api/auth/otp.
      if (profile.is_active === false) {
        return NextResponse.json(
          { error: "This account has been deactivated. Contact support to reactivate it." },
          { status: 403 },
        );
      }

      await recordLoginEvent(req, user.id, "password");
      return NextResponse.json({ data: { user, session, profile } });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[password auth] error:", err);
    return NextResponse.json({ error: err.message || "Authentication failed" }, { status: 500 });
  }
}
