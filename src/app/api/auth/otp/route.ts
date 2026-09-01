import { NextRequest, NextResponse } from "next/server";
import { authApi } from "@/lib/services/auth";
import { ensureProfile } from "@/lib/services/ensureProfile";
import { recordLoginEvent } from "@/lib/services/loginEvents";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { action, phone, email, token, type } = await req.json();

    // Send OTP action
    if (action === "send") {
      if (email) {
        // Email OTP - sends magic link by default, use .Token in email template for OTP code
        const { data, error } = await authApi.signInWithEmailOtp(email);
        if (error) {
          console.error("[OTP] Email OTP send error:", error);
          throw error;
        }
        return NextResponse.json({ 
          data,
          message: "OTP sent to email" 
        });
      }
      if (phone) {
        const { data, error } = await authApi.signInWithOtp(phone);
        if (error) {
          console.error("[OTP] Phone OTP send error:", error);
          throw error;
        }
        return NextResponse.json({ 
          data,
          message: "OTP sent to phone" 
        });
      }
      return NextResponse.json({ error: "Provide phone or email" }, { status: 400 });
    }

    // Verify OTP action
    if (action === "verify") {
      const otpType = type || (email ? "email" : "sms");
      
      const { data, error } = await authApi.verifyOtp({
        ...(phone ? { phone } : {}),
        ...(email ? { email } : {}),
        token,
        type: otpType,
      });
      
      if (error) {
        console.error("[OTP] Verification error:", error);
        throw error;
      }

      const user = data?.user;
      const session = data?.session;
      
      if (user) {
        const profile = await ensureProfile(user);

        // Supabase Auth itself is banned on deactivation (see
        // deactivateUserAccount), which normally rejects this verifyOtp call
        // outright -- this is the belt-and-suspenders check for the window
        // right after a ban is lifted, or if the ban write failed. Deny the
        // session client-side rather than handing back a working one.
        if (profile.is_active === false) {
          return NextResponse.json(
            { error: "This account has been deactivated. Contact support to reactivate it." },
            { status: 403 },
          );
        }

        await recordLoginEvent(req, user.id, otpType === "email" ? "email_otp" : "phone_otp");

        return NextResponse.json({
          data: {
            user,
            session,
            profile
          }
        });
      }

      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[OTP] Error:", err);
    return NextResponse.json(
      { error: err.message || "Authentication failed" }, 
      { status: 500 }
    );
  }
}
