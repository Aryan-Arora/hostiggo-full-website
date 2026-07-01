import { NextRequest, NextResponse } from "next/server";
import { authApi } from "@/lib/services/auth";
import { usersAPI } from "@/lib/services/user";

export const dynamic = "force-dynamic";

const ensureProfile = async (user: { id: string; phone?: string; email?: string; user_metadata?: Record<string, any> }) => {
  const existing = await usersAPI.getUserById(user.id);
  if (existing) return existing;
  return usersAPI.upsertUser({
    user_id: user.id,
    name: user.user_metadata?.full_name || user.user_metadata?.name || "",
    email: user.email || user.user_metadata?.email || "",
    phone: user.phone || null,
    age: user.user_metadata?.age || null,
    emergency_contact: user.user_metadata?.emergency_contact || null,
    is_verified: true,
    is_active: true,
  });
};

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
