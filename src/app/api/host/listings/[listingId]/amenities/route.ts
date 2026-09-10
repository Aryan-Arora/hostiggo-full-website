import { NextRequest, NextResponse } from "next/server";
import { assertListingOwnedBy } from "@/lib/services/admin-writes";
import { getListingAmenityIds, setListingAmenities } from "@/lib/services/amenities-write";
import { errorMessage } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, props: { params: Promise<{ listingId: string }> }) {
  const params = await props.params;
  try {
    const listingId = parseInt(params.listingId, 10);
    if (isNaN(listingId)) {
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
    }
    const amenityIds = await getListingAmenityIds(listingId);
    return NextResponse.json({ data: { amenityIds } });
  } catch (error) {
    console.error("[api/listings/amenities] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch amenities" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ listingId: string }> }) {
  const params = await props.params;
  try {
    const listingId = parseInt(params.listingId, 10);
    if (isNaN(listingId)) {
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
    }
    const body = await req.json();
    const { userId, amenityIds } = body;
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    if (!Array.isArray(amenityIds)) {
      return NextResponse.json({ error: "amenityIds[] is required" }, { status: 400 });
    }
    await assertListingOwnedBy(listingId, String(userId));
    const saved = await setListingAmenities(listingId, amenityIds.map(Number));
    return NextResponse.json({ data: { amenityIds: saved } });
  } catch (error) {
    console.error("[api/listings/amenities] PATCH error:", error);
    return NextResponse.json(
      { error: errorMessage(error, "Failed to save amenities") },
      { status: 500 },
    );
  }
}
