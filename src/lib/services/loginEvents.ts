import "server-only";
import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type LoginMethod = "email_otp" | "phone_otp" | "password" | "google";

// Called from every server-side sign-in success path (OTP verify, password
// sign-in, and the Google callback's log-login call) -- best-effort only:
// a failure here must never block an actual sign-in, so errors are logged
// and swallowed rather than thrown.
export async function recordLoginEvent(req: NextRequest, userId: string, method: LoginMethod) {
  try {
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
    const userAgent = req.headers.get("user-agent");

    const { error } = await supabaseAdmin.from("login_events").insert({
      user_id: userId,
      method,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
    if (error) throw error;
  } catch (err) {
    console.error("[recordLoginEvent] failed to record login event:", err);
  }
}
