import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { readJsonBody } from "@/lib/auth-server";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Tells the sign-in flow whether an email is already a Hostiggo account, so
// it can branch: existing email -> ask for password; new email -> send an
// OTP and have them create a password after verifying it. Checks our own
// `users` table (same source of truth every other profile lookup in this
// app uses) rather than the Auth admin API, which has no efficient
// by-email lookup.
export async function POST(req: NextRequest) {
  try {
    // The sign-in flow needs to branch on "existing account or not", which
    // is inherently an existence check -- rate-limit it so it can't be used
    // to bulk-enumerate which emails have accounts.
    const limited = rateLimit(`check-email:${clientIp(req)}`, 10, 60_000);
    if (limited) return limited;
    const body = await readJsonBody(req);
    if (body instanceof NextResponse) return body;
    const { email } = body;
    if (!email || typeof email !== "string" || email.length > 254) {
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
