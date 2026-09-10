import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { assertListingOwnedBy } from "@/lib/services/admin-writes";

export const dynamic = "force-dynamic";

/**
 * GET /api/host/calendar/status
 * Get the iCal sync status for a listing
 * Returns the iCal URL and sync metadata stored in the Supabase listing
 */
export async function GET(req: NextRequest) {
  try {
    const listingId = req.nextUrl.searchParams.get("listingId");
    const userId = req.nextUrl.searchParams.get("userId");

    if (!listingId || !userId) {
      return NextResponse.json({ error: "listingId and userId are required" }, { status: 400 });
    }

    const listingNum = Number(listingId);
    if (isNaN(listingNum)) {
      return NextResponse.json({ error: "listingId must be a valid number" }, { status: 400 });
    }
    // icalLink can carry a private, token-bearing feed URL -- guard the
    // read too, not just the write.
    await assertListingOwnedBy(listingNum, userId);

    // Fetch the listing's iCal status
    const { data: listing, error: fetchError } = await supabaseAdmin
      .from("listings")
      .select("listing_id, title, icalLink, updated_at")
      .eq("listing_id", listingNum)
      .maybeSingle();

    if (fetchError) {
      console.error("[GET /api/host/calendar/status] Fetch error:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        listingId: listing.listing_id,
        title: listing.title,
        icalUrl: listing.icalLink || null,
        isActive: !!listing.icalLink,
        lastUpdated: listing.updated_at,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/host/calendar/status] Exception:", err);
    return NextResponse.json({ error: err.message || "Request failed" }, { status: 500 });
  }
}

