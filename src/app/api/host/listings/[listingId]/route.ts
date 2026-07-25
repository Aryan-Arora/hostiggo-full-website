import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/host/listings/[listingId]
 * Permanently removes a listing and its dependent rows. Blocked if the
 * listing has any bookings -- pausing (is_active=false) is the correct
 * action for a listing with booking history, deletion would orphan them.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { listingId: string } },
) {
  try {
    const listingId = parseInt(params.listingId, 10);
    if (isNaN(listingId)) {
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
    }

    const { data: bookings, error: bookingsErr } = await supabaseAdmin
      .from("bookings")
      .select("booking_id")
      .eq("listing_id", listingId)
      .limit(1);
    if (bookingsErr) throw bookingsErr;
    if (bookings && bookings.length > 0) {
      return NextResponse.json(
        { error: "This listing has bookings and can't be deleted. Pause it instead to hide it from guests." },
        { status: 409 },
      );
    }

    const childTables = [
      "listing_amenities",
      "listing_media",
      "listing_addons",
      "listing_discounts",
      "listing_calendar",
      "review",
      "listing_house_rules",
      "listing_safety_details",
    ];
    for (const table of childTables) {
      const { error } = await supabaseAdmin.from(table).delete().eq("listing_id", listingId);
      if (error) throw error;
    }

    const { error: deleteErr } = await supabaseAdmin
      .from("listings")
      .delete()
      .eq("listing_id", listingId);
    if (deleteErr) throw deleteErr;

    return NextResponse.json({ data: { success: true } });
  } catch (err: any) {
    console.error("[DELETE /api/host/listings/[listingId]] error:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to delete listing" }, { status: 500 });
  }
}
