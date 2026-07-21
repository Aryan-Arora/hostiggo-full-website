import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { assertListingOwnedBy } from "@/lib/services/admin-writes";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/host/listings/update
 * Update listing details (title, description, pricing, capacity, location, address, etc.)
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      listingId,
      userId,
      title,
      description,
      price_weekday,
      price_weekend,
      num_guests,
      num_bedrooms,
      num_beds,
      num_bathrooms,
      location_id,
      address_line1,
      address_line2,
      landmark,
    } = body;

    if (!listingId || !userId) {
      return NextResponse.json({ error: "listingId and userId are required" }, { status: 400 });
    }
    await assertListingOwnedBy(Number(listingId), String(userId));

    for (const [label, value] of [
      ["price_weekday", price_weekday],
      ["price_weekend", price_weekend],
    ] as const) {
      if (value !== undefined && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 10000000)) {
        return NextResponse.json({ error: `${label} out of range` }, { status: 400 });
      }
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (price_weekday !== undefined) updateData.price_weekday = parseFloat(String(price_weekday));
    if (price_weekend !== undefined) updateData.price_weekend = parseFloat(String(price_weekend));
    if (num_guests !== undefined) updateData.num_guests = num_guests;
    if (num_bedrooms !== undefined) updateData.num_bedrooms = num_bedrooms;
    if (num_beds !== undefined) updateData.num_beds = num_beds;
    if (num_bathrooms !== undefined) updateData.num_bathrooms = num_bathrooms;
    if (location_id !== undefined) updateData.location_id = location_id;
    if (address_line1 !== undefined) updateData.address_line1 = address_line1;
    if (address_line2 !== undefined) updateData.address_line2 = address_line2;
    if (landmark !== undefined) updateData.landmark = landmark;

    // Always update the updated_at timestamp
    updateData.updated_at = new Date().toISOString();


    // Update listing
    const { data, error } = await supabaseAdmin
      .from("listings")
      .update(updateData)
      .eq("listing_id", listingId)
      .select(
        "listing_id, title, description, price_weekday, price_weekend, num_guests, num_bedrooms, num_beds, num_bathrooms, location_id, address_line1, address_line2, landmark, updated_at",
      );

    if (error) {
      console.error("[PATCH /api/host/listings/update] Supabase error:", error);
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: 500 },
      );
    }

    if (!data || data.length === 0) {
      console.error("[PATCH /api/host/listings/update] No rows returned after update");
      return NextResponse.json({ error: "Listing not found or update failed" }, { status: 404 });
    }


    return NextResponse.json({
      data: {
        success: true,
        listing: data[0],
      },
    });
  } catch (err: any) {
    console.error("[PATCH /api/host/listings/update] Exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
