import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { assertListingOwnedBy } from "@/lib/services/admin-writes";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/host/listings/toggle
 * Toggle listing pause/unpause status (is_active)
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { listingId, isActive, userId } = body;

    if (!listingId || isActive === undefined || !userId) {
      return NextResponse.json(
        { error: "listingId, isActive and userId are required" },
        { status: 400 },
      );
    }
    await assertListingOwnedBy(Number(listingId), String(userId));

    // Update listing active status
    const { data, error } = await supabaseAdmin
      .from("listings")
      .update({ is_active: isActive })
      .eq("listing_id", listingId)
      .select("listing_id, is_active, title");

    if (error) {
      console.error("[PATCH /api/host/listings/toggle] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        listingId: data[0].listing_id,
        isActive: data[0].is_active,
        title: data[0].title,
      },
    });
  } catch (err: any) {
    console.error("[PATCH /api/host/listings/toggle] Exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
