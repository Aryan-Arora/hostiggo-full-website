import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId, UnauthorizedError } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// Sets (or changes) the caller's password. Deliberately does not ask for
// the current password: identity here is proven by an already-valid,
// unexpired Supabase session (the same bearer-token check every other
// sensitive route in this app relies on -- see getAuthenticatedUserId),
// which is exactly what Supabase's own auth.updateUser(password) trusts
// too. Using the admin client rather than a client-side session means this
// works uniformly regardless of how the caller originally signed in --
// including phone/email-OTP-only and Google accounts that have never had a
// password before, turning this into a genuine "add a password" flow for
// them, not just a change for people who already had one.
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);
    const { newPassword } = await req.json();

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (error) {
      console.error("[change-password] update failed:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: "Please sign in again to manage your password." },
        { status: 401 },
      );
    }
    console.error("[change-password] error:", err);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
