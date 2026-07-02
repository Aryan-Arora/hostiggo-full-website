import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, about } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Update the host's about section
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from("host")
      .update({ about: about?.trim() || null })
      .eq("user_id", userId)
      .select("host_uuid, about, is_verified");

    if (updateError) {
      console.error("[PATCH /api/host/profile] Update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!updateData || updateData.length === 0) {
      return NextResponse.json({ error: "Host profile not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      data: { 
        success: true, 
        about: updateData[0].about,
        hostUuid: updateData[0].host_uuid,
        isVerified: updateData[0].is_verified,
      } 
    });
  } catch (err: any) {
    console.error("[PATCH /api/host/profile] Exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
