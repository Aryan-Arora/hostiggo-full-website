import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// Tells the sign-in flow whether an email is already a Hostiggo account, so
// it can branch: existing email -> ask for password; new email -> send an
// OTP and have them create a password after verifying it. Checks our own
// `users` table (same source of truth every other profile lookup in this
// app uses) rather than the Auth admin API, which has no efficient
// by-email lookup.
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("user_id")
      .ilike("email", email.trim())
      .limit(1)
      .maybeSingle();
    if (error) throw error;

    return NextResponse.json({ data: { exists: !!data } });
  } catch (err) {
    console.error("[/api/auth/check-email] error:", err);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
