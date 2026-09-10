import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Read/write a listing's amenity selections. `listing_amenities` is a plain
// join table (listing_id, amenity_id), so a save is a full replace of the
// listing's rows -- mirrors how house-rules saves the whole structured row
// rather than diffing individual items.

export async function getListingAmenityIds(listingId: number): Promise<number[]> {
  const { data, error } = await supabaseAdmin
    .from("listing_amenities")
    .select("amenity_id")
    .eq("listing_id", listingId);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.amenity_id as number);
}

export async function setListingAmenities(
  listingId: number,
  amenityIds: number[],
): Promise<number[]> {
  const unique = [...new Set(amenityIds.filter((n) => Number.isInteger(n) && n > 0))];

  const { error: delErr } = await supabaseAdmin
    .from("listing_amenities")
    .delete()
    .eq("listing_id", listingId);
  if (delErr) throw delErr;

  if (unique.length) {
    const { error: insErr } = await supabaseAdmin
      .from("listing_amenities")
      .insert(unique.map((amenity_id) => ({ listing_id: listingId, amenity_id })));
    if (insErr) throw insErr;
  }
  return unique;
}
