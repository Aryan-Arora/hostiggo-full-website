import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { registerListing, deactivateListing } from "@/lib/services/ical";

export const dynamic = "force-dynamic";

/**
 * POST /api/host/calendar/register
 * Register or update an iCal feed URL for a listing
 * This endpoint calls the external iCal microservice and updates the listing's icalLink
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { listingId, icalUrl, action } = body ?? {};

    // Validate input
    if (!listingId) {
      return NextResponse.json({ error: "listingId is required" }, { status: 400 });
    }

    if (!["add", "update", "deactivate"].includes(action)) {
      return NextResponse.json(
        { error: "action must be one of: add, update, deactivate" },
        { status: 400 },
      );
    }

    if (action !== "deactivate" && !icalUrl?.trim()) {
      return NextResponse.json(
        { error: "icalUrl is required for add/update actions" },
        { status: 400 },
      );
    }

    const listingNum = Number(listingId);
    if (isNaN(listingNum)) {
      return NextResponse.json({ error: "listingId must be a valid number" }, { status: 400 });
    }

    // Call the external iCal service to register/update/deactivate
    let icalResponse;
    try {
      if (action === "deactivate") {
        await deactivateListing(listingNum);
        icalResponse = { status: "deactivated", slotOffsetS: 0 };
      } else {
        icalResponse = await registerListing(listingNum, icalUrl, action);
      }
    } catch (serviceError) {
      console.error("[POST /api/host/calendar/register] iCal service error:", serviceError);
      return NextResponse.json(
        {
          error:
            serviceError instanceof Error
              ? serviceError.message
              : "Failed to register with iCal service",
        },
        { status: 502 },
      );
    }

    // Update the listing in Supabase with the iCal URL (or null if deactivating)
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (action === "deactivate") {
      updatePayload.icalLink = null;
    } else if (icalUrl) {
      updatePayload.icalLink = icalUrl;
    }

    const { data: updatedListing, error: updateError } = await supabaseAdmin
      .from("listings")
      .update(updatePayload)
      .eq("listing_id", listingNum)
      .select("listing_id, icalLink, title");

    if (updateError) {
      console.error("[POST /api/host/calendar/register] Supabase update error:", updateError);
      return NextResponse.json(
        { error: `Failed to update listing: ${updateError.message}` },
        { status: 500 },
      );
    }

    if (!updatedListing || updatedListing.length === 0) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        success: true,
        listing: updatedListing[0],
        icalResponse,
      },
    });
  } catch (err: any) {
    console.error("[POST /api/host/calendar/register] Exception:", err);
    return NextResponse.json({ error: err.message || "Request failed" }, { status: 500 });
  }
}

