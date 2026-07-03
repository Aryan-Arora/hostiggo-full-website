import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// Ensures a `host` row exists for this user (idempotent) — called the first
// time a user reaches /host/listings via "Host & Earn" so they can create
// listings without a manually-seeded host row.
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const { data: existing, error: findErr } = await supabaseAdmin
      .from("host")
      .select("host_uuid, about, is_verified")
      .eq("user_id", userId)
      .maybeSingle();
    if (findErr) throw findErr;

    if (existing) {
      return NextResponse.json({
        data: {
          hostUuid: existing.host_uuid,
          about: existing.about,
          isVerified: existing.is_verified,
          created: false,
        },
      });
    }

    const { data: created, error: insertErr } = await supabaseAdmin
      .from("host")
      .insert({ user_id: userId })
      .select("host_uuid, about, is_verified")
      .single();
    if (insertErr) throw insertErr;

    return NextResponse.json({
      data: {
        hostUuid: created.host_uuid,
        about: created.about,
        isVerified: created.is_verified,
        created: true,
      },
    });
  } catch (err: any) {
    console.error("[POST /api/host/profile] Exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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
