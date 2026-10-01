import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { readJsonBody, requireUserId } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("phone")
      .eq("user_id", userId)
      .maybeSingle();
    const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);

    return NextResponse.json({
      profilePhone: user?.phone,
      authPhone: authData.user?.phone,
      hasPhone: !!(user?.phone || authData.user?.phone),
    });
  } catch (err) {
    console.error("[/api/user/phone] GET error:", err);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}

/**
 * Saves the caller's contact phone (used for WhatsApp booking updates) on
 * their profile. Deliberately does NOT change the phone on the auth account:
 * that number signs people in via OTP, so setting it without proving
 * ownership would let someone attach a number they don't control -- and the
 * real owner's next OTP sign-in would land in this account.
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;
    const body = await readJsonBody(req);
    if (body instanceof NextResponse) return body;

    const digits = String(body.phone ?? "")
      .replace(/[^\d]/g, "")
      .replace(/^(91|0)(?=\d{10}$)/, "");
    if (!/^[6-9]\d{9}$/.test(digits)) {
      return NextResponse.json({ error: "Enter a valid 10-digit Indian mobile number." }, { status: 400 });
    }
    const phone = `+91${digits}`;

    const { error } = await supabaseAdmin.from("users").update({ phone }).eq("user_id", userId);
    if (error) {
      console.error("[/api/user/phone] Error updating users table:", error);
      return NextResponse.json({ error: "Couldn't save your phone number." }, { status: 500 });
    }
    return NextResponse.json({ success: true, phone });
  } catch (err) {
    console.error("[/api/user/phone] POST error:", err);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
