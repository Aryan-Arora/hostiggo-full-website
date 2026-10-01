import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { forbiddenResponse, requireUserId } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // IPs and devices of past sign-ins: only ever the caller's own.
    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;
    const requested = req.nextUrl.searchParams.get("userId");
    if (requested && requested !== userId) return forbiddenResponse();

    const { data, error } = await supabaseAdmin
      .from("login_events")
      .select("id, method, ip_address, user_agent, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("[/api/auth/login-events] error:", err);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
