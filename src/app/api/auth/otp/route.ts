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

    if (action === "send") {
      if (email) {
        const { data, error } = await authApi.signInWithEmailOtp(email);
        if (error) throw error;
        return NextResponse.json({ data });
      }
      if (phone) {
        const { data, error } = await authApi.signInWithOtp(phone);
        if (error) throw error;
        return NextResponse.json({ data });
      }
      return NextResponse.json({ error: "Provide phone or email" }, { status: 400 });
    }

    if (action === "verify") {
      const otpType = type || (email ? "email" : "sms");
      const { data, error } = await authApi.verifyOtp({
        ...(phone ? { phone } : {}),
        ...(email ? { email } : {}),
        token,
        type: otpType,
      });
      if (error) throw error;

      const user = data?.user;
      if (user) {
        const profile = await ensureProfile(user);
        return NextResponse.json({ data: { ...data, profile } });
      }

      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
