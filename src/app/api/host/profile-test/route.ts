import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/**
 * Test endpoint to check host data in the database
 * GET /api/host/profile-test?userId=...
 */
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Get raw host data
    const { data: hosts, error: hostError } = await supabaseAdmin
      .from("host")
      .select("*")
      .eq("user_id", userId);

    if (hostError) {
      return NextResponse.json({ 
        error: hostError.message,
        code: hostError.code,
        details: hostError.details 
      }, { status: 500 });
    }

    return NextResponse.json({
      userId,
      hostCount: hosts?.length || 0,
      hosts: hosts || [],
      columns: hosts && hosts.length > 0 ? Object.keys(hosts[0]) : [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
