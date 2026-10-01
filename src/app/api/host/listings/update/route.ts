import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth-server";
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
      latitude,
      longitude,
    } = body;

    if (!listingId) {
      return NextResponse.json({ error: "listingId is required" }, { status: 400 });
    }
    const authedUserId = await requireUserId(req);
    if (authedUserId instanceof NextResponse) return authedUserId;
    await assertListingOwnedBy(Number(listingId), authedUserId);

    for (const [label, value] of [
      ["price_weekday", price_weekday],
      ["price_weekend", price_weekend],
    ] as const) {
      // Same nightly-price bounds as publishing (/api/host/listings).
      if (value !== undefined && (!Number.isFinite(Number(value)) || Number(value) < 100 || Number(value) > 500000)) {
        return NextResponse.json(
          { error: `${label === "price_weekday" ? "Weekday" : "Weekend"} price must be between ₹100 and ₹5,00,000 per night.` },
          { status: 400 },
        );
      }
    }
    if (title !== undefined && (!String(title).trim() || String(title).length > 120)) {
      return NextResponse.json({ error: "Title must be 1-120 characters." }, { status: 400 });
    }
    if (description !== undefined && (!String(description).trim() || String(description).length > 5000)) {
      return NextResponse.json({ error: "Description must be 1-5000 characters." }, { status: 400 });
    }
    for (const [label, value, min] of [
      ["Guests", num_guests, 1],
      ["Bedrooms", num_bedrooms, 0],
      ["Beds", num_beds, 1],
      ["Bathrooms", num_bathrooms, 0],
    ] as const) {
      if (value !== undefined && (!Number.isInteger(Number(value)) || Number(value) < min || Number(value) > 50)) {
        return NextResponse.json({ error: `${label} must be a whole number from ${min} to 50.` }, { status: 400 });
      }
    }
    if (latitude !== undefined && (!Number.isFinite(Number(latitude)) || Math.abs(Number(latitude)) > 90)) {
      return NextResponse.json({ error: "latitude out of range" }, { status: 400 });
    }
    if (longitude !== undefined && (!Number.isFinite(Number(longitude)) || Math.abs(Number(longitude)) > 180)) {
      return NextResponse.json({ error: "longitude out of range" }, { status: 400 });
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    if (title !== undefined) updateData.title = String(title).trim();
    if (description !== undefined) updateData.description = String(description).trim();
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
    if (latitude !== undefined) updateData.latitude = parseFloat(String(latitude));
    if (longitude !== undefined) updateData.longitude = parseFloat(String(longitude));

    // Always update the updated_at timestamp
    updateData.updated_at = new Date().toISOString();


    // Update listing
    const { data, error } = await supabaseAdmin
      .from("listings")
      .update(updateData)
      .eq("listing_id", listingId)
      .select(
        "listing_id, title, description, price_weekday, price_weekend, num_guests, num_bedrooms, num_beds, num_bathrooms, location_id, address_line1, address_line2, landmark, latitude, longitude, updated_at",
      );

    if (error) {
      console.error("[PATCH /api/host/listings/update] Supabase error:", error);
      return NextResponse.json({ error: "Couldn't save your changes. Please try again." }, { status: 500 });
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
