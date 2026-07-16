import { supabaseAdmin } from "../supabase-admin";

// All functions here run with the service-role key (RLS bypassed) and must only
// be called from /app/api/* route handlers.

// ── Host Profile ─────────────────────────────────────────────────────────────
/**
 * Ensures a host profile exists for the given user.
 * If no host profile exists, creates one automatically.
 * If multiple host profiles exist (data issue), returns the first one.
 * This allows any authenticated user to become a host.
 * 
 * @param userId The user's ID
 * @returns The host_uuid for the user
 */
export async function ensureHostProfile(userId: string): Promise<string> {
  // Get all host profiles for this user (there should be only 1, but handle multiples)
  const { data: hosts, error: checkError } = await supabaseAdmin
    .from("host")
    .select("host_uuid")
    .eq("user_id", userId)
    .limit(10); // Limit to avoid retrieving too many rows
  
  if (checkError) {
    console.error("[ensureHostProfile] Check error:", checkError);
    throw checkError;
  }
  
  // If host profiles exist, return the first one
  if (hosts && hosts.length > 0) {
    if (hosts.length > 1) {
      console.warn(
        `[ensureHostProfile] Found ${hosts.length} host profiles for user ${userId}. Using first one.`,
        hosts.map((h) => h.host_uuid)
      );
    }
    return hosts[0].host_uuid;
  }
  
  // Create a new host profile for this user
  console.log(`[ensureHostProfile] Creating new host profile for user ${userId}`);
  
  const { data: newHost, error: createError } = await supabaseAdmin
    .from("host")
    .insert({
      user_id: userId,
      is_verified: false,
    })
    .select("host_uuid")
    .single();
  
  if (createError) {
    console.error("[ensureHostProfile] Failed to create host profile:", createError);
    throw new Error(`Could not create host profile: ${createError.message}`);
  }
  
  if (!newHost?.host_uuid) {
    throw new Error("Failed to create host profile for user");
  }
  
  console.log(`[ensureHostProfile] Successfully created host profile with UUID: ${newHost.host_uuid}`);
  return newHost.host_uuid;
}

// ── Storage ──────────────────────────────────────────────────────────────────
const LISTING_BUCKET = "homestay photos";

export async function uploadListingPhoto(file: {
  data: ArrayBuffer;
  name: string;
  type: string;
}): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `listings/uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabaseAdmin.storage
    .from(LISTING_BUCKET)
    .upload(path, file.data, { contentType: file.type || "image/jpeg", upsert: false });
  if (error) throw error;
  const { data } = supabaseAdmin.storage.from(LISTING_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// ── Calendar ─────────────────────────────────────────────────────────────────
export async function upsertCalendarDay(input: {
  listingId: number;
  date: string; // yyyy-mm-dd
  price?: number;
  isAvailable?: boolean;
  currency?: string;
}) {
  const { listingId, date, price, isAvailable, currency } = input;

  // Find an existing row for this (listing, date) so we update in place rather
  // than relying on a specific unique-constraint name for upsert.
  const { data: existing, error: findErr } = await supabaseAdmin
    .from("listing_calendar")
    .select("calendar_id, price, is_available, currency")
    .eq("listing_id", listingId)
    .eq("date", date)
    .maybeSingle();
  if (findErr) throw findErr;

  const patch: Record<string, any> = { updated_at: new Date().toISOString() };
  if (price !== undefined) patch.price = price;
  if (isAvailable !== undefined) patch.is_available = isAvailable;
  if (currency !== undefined) patch.currency = currency;

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from("listing_calendar")
      .update(patch)
      .eq("calendar_id", existing.calendar_id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabaseAdmin
    .from("listing_calendar")
    .insert({
      listing_id: listingId,
      date,
      price: price ?? 0,
      is_available: isAvailable ?? true,
      currency: currency ?? "INR",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Bookings ─────────────────────────────────────────────────────────────────
export async function createBooking(input: {
  listingId: number;
  userId: string;
  startDate: string;
  endDate: string;
  numAdults?: number;
  numChildren?: number;
  amount?: number;
}) {
  // Resolve the owning host from the listing.
  const { data: listing, error: lerr } = await supabaseAdmin
    .from("listings")
    .select("host_uuid, price_weekday")
    .eq("listing_id", input.listingId)
    .maybeSingle();
  if (lerr) throw lerr;
  if (!listing?.host_uuid) throw new Error("Listing not found");

  // The price is always computed server-side from the listing's real rate,
  // mirroring the exact formula the guest UI displays (property/[id]/page.tsx:
  // subtotal = price_weekday * nights, +8% service fee, +12% tax). The
  // client-submitted `amount` is never trusted — without this, a caller could
  // POST any amount (including 0) for a real, confirmed booking.
  const nightsCount = eachDateInRange(input.startDate, input.endDate).length;
  const subtotal = Number(listing.price_weekday ?? 0) * Math.max(1, nightsCount);
  const serviceFee = Math.round(subtotal * 0.08);
  const taxes = Math.round(subtotal * 0.12);
  const computedAmount = subtotal + serviceFee + taxes;

  // Check A: blocked calendar days in the requested range.
  const { data: blocked, error: blockedErr } = await supabaseAdmin
    .from("listing_calendar")
    .select("date")
    .eq("listing_id", input.listingId)
    .gte("date", input.startDate)
    .lt("date", input.endDate) // end date is check-out night, not a stay night
    .eq("is_available", false);
  if (blockedErr) throw blockedErr;
  if (blocked && blocked.length > 0)
    throw new Error("Some of the selected dates are not available.");

  // Check B: overlapping confirmed bookings for the same listing.
  const { data: conflicts, error: conflictsErr } = await supabaseAdmin
    .from("bookings")
    .select("booking_id")
    .eq("listing_id", input.listingId)
    .eq("status_id", 2) // CONFIRMED only
    .lt("start_date", input.endDate) // existing booking starts before new end
    .gt("end_date", input.startDate); // existing booking ends after new start
  if (conflictsErr) throw conflictsErr;
  if (conflicts && conflicts.length > 0)
    throw new Error("These dates are already booked.");

  const numAdults = input.numAdults ?? 1;
  const numChildren = input.numChildren ?? 0;

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .insert({
      listing_id: input.listingId,
      user_id: input.userId,
      start_date: input.startDate,
      end_date: input.endDate,
      num_adults: numAdults,
      num_children: numChildren,
      nom_guests: numAdults + numChildren,
      amount: computedAmount,
      // booking_status only defines 2=CONFIRMED, 3=CANCELLED (no pending row),
      // so a new reservation is created as CONFIRMED.
      status_id: 2,
      host_uuid: listing.host_uuid,
      booked_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;

  // Block all nights in the booked range so they can't be double-booked.
  const nights = eachDateInRange(input.startDate, input.endDate);
  if (nights.length) {
    const now = new Date().toISOString();
    // Update existing calendar rows first, then insert missing ones.
    const { data: existing } = await supabaseAdmin
      .from("listing_calendar")
      .select("calendar_id, date")
      .eq("listing_id", input.listingId)
      .in("date", nights);

    const existingDates = new Set((existing ?? []).map((r: any) => r.date));

    if (existing?.length) {
      await supabaseAdmin
        .from("listing_calendar")
        .update({ is_available: false, updated_at: now })
        .eq("listing_id", input.listingId)
        .in("date", nights);
    }

    const missing = nights.filter((d) => !existingDates.has(d));
    if (missing.length) {
      await supabaseAdmin.from("listing_calendar").insert(
        missing.map((date) => ({
          listing_id: input.listingId,
          date,
          is_available: false,
          price: 0,
          currency: "INR",
        })),
      );
    }
  }

  return data;
}

function eachDateInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const cur = new Date(startDate);
  const end = new Date(endDate);
  while (cur < end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

// ── Booking cancellation ─────────────────────────────────────────────────────
export async function cancelBooking(bookingId: number, reason?: string | null) {
  const patch: Record<string, any> = { status_id: 3 }; // 3 = CANCELLED
  if (reason) patch.cancellation_reason = reason;
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .update(patch)
    .eq("booking_id", bookingId)
    .select("booking_id, status_id, cancellation_reason")
    .single();
  if (error) throw error;
  return data;
}

// ── Reviews ──────────────────────────────────────────────────────────────────
export async function createReview(input: {
  listingId: number;
  userId: string;
  rating: number;
  comment?: string | null;
}) {
  // Only allow reviews after a confirmed stay has ended.
  const today = new Date().toISOString().slice(0, 10);
  const { data: eligible, error: eligErr } = await supabaseAdmin
    .from("bookings")
    .select("booking_id")
    .eq("listing_id", input.listingId)
    .eq("user_id", input.userId)
    .eq("status_id", 2) // CONFIRMED
    .lt("end_date", today) // stay has ended
    .limit(1)
    .maybeSingle();
  if (eligErr) throw eligErr;
  if (!eligible)
    throw new Error("You can only review a listing after completing your stay.");

  const { data, error } = await supabaseAdmin
    .from("review")
    .insert({
      listing_id: input.listingId,
      user_id: input.userId,
      rating: input.rating,
      comment: input.comment ?? null,
      reviewd_at: new Date().toISOString(), // note: column is misspelled in schema
    })
    .select("review_id, listing_id, rating, comment")
    .single();
  if (error) throw error;
  return data;
}

// ── Feedback ─────────────────────────────────────────────────────────────────
export async function createFeedback(input: {
  userId?: string | null;
  type: string;
  description: string;
  category?: string | null;
  rating?: number | null;
  comment?: string | null;
}) {
  const { data, error } = await supabaseAdmin
    .from("feedback")
    .insert({
      user_id: input.userId ?? null,
      type: input.type,
      description: input.description,
      category: input.category ?? null,
      rating: input.rating ?? null,
      comment: input.comment ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Listings (create from wizard draft) ──────────────────────────────────────
export type ListingDraft = {
  userId: string;
  title?: string;
  description?: string;
  priceWeekday?: number;
  priceWeekend?: number;
  numGuests?: number;
  numBedrooms?: number;
  numBeds?: number;
  numBathrooms?: number;
  amenityIds?: number[];
  addonSelections?: { addon_id: number; price: number; includes: string }[];
  photoUrls?: string[];
  checkInTime?: string;
  checkOutTime?: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  locationId?: number;
  currency?: string;
  latitude?: number;
  longitude?: number;
};

export async function createListing(draft: ListingDraft) {
  // Ensure the user has a host profile (auto-create if needed)
  const hostUuid = await ensureHostProfile(draft.userId);

  const now = new Date().toISOString();
  const row: Record<string, any> = {
    title: draft.title?.trim() || "Untitled listing",
    description: draft.description?.trim() || "", // column is NOT NULL

    price_weekday: draft.priceWeekday ?? 0,
    price_weekend: draft.priceWeekend ?? draft.priceWeekday ?? 0,
    num_guests: draft.numGuests ?? 1,
    num_bedrooms: draft.numBedrooms ?? 1,
    num_beds: draft.numBeds ?? 1,
    num_bathrooms: draft.numBathrooms ?? 1,
    host_uuid: hostUuid,
    is_active: true, // new listings start active (visible)
    check_in_time: draft.checkInTime ?? "14:00:00",
    check_out_time: draft.checkOutTime ?? "11:00:00",
    address_line1: draft.addressLine1 ?? null,
    address_line2: draft.addressLine2 ?? null,
    landmark: draft.landmark ?? null,
    latitude: draft.latitude ?? null,
    longitude: draft.longitude ?? null,
    created_at: now,
    updated_at: now,
  };
  if (draft.locationId) row.location_id = draft.locationId;

  const { data: listing, error } = await supabaseAdmin
    .from("listings")
    .insert(row)
    .select("listing_id, title")
    .single();
  if (error) throw error;

  const listingId = listing.listing_id;
  const warnings: string[] = [];

  // Amenities (join rows).
  if (draft.amenityIds?.length) {
    const amenRows = draft.amenityIds.map((amenity_id) => ({ listing_id: listingId, amenity_id }));
    const { error: aerr } = await supabaseAdmin.from("listing_amenities").insert(amenRows);
    if (aerr) {
      console.error("[createListing] amenities insert failed:", aerr.message);
      warnings.push("Your listing was created, but the selected amenities failed to save.");
    }
  }

  // Add-ons picked in the wizard (host can still add/remove/reprice these
  // later from listing settings - this just seeds the initial selection).
  if (draft.addonSelections?.length) {
    const addonRows = draft.addonSelections.map((s) => ({
      listing_id: listingId,
      addon_id: s.addon_id,
      price: s.price ?? 0,
      includes: s.includes ?? "",
    }));
    const { error: addonErr } = await supabaseAdmin.from("listing_addons").insert(addonRows);
    if (addonErr) {
      console.error("[createListing] addons insert failed:", addonErr.message);
      warnings.push("Your listing was created, but the selected add-ons failed to save.");
    }
  }

  // Photos (media rows). First photo is the cover.
  if (draft.photoUrls?.length) {
    const mediaRows = draft.photoUrls.map((media_url, i) => ({
      listing_id: listingId,
      media_url,
      media_type: "image",
      is_cover: i === 0,
    }));
    const { error: merr } = await supabaseAdmin.from("listing_media").insert(mediaRows);
    if (merr) {
      console.error("[createListing] media insert failed:", merr.message);
      warnings.push("Your listing was created, but the photos failed to save.");
    }
  }

  return { listing_id: listingId, title: listing.title, warnings };
}

// ── User profile ─────────────────────────────────────────────────────────────
export async function updateUserProfile(
  userId: string,
  patch: Partial<{ name: string; email: string; phone: string; age: number; emergency_contact: string }>,
) {
  const clean: Record<string, any> = { updated_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined && v !== null && v !== "") clean[k] = v;
  }
  const { data, error } = await supabaseAdmin
    .from("users")
    .update(clean)
    .eq("user_id", userId)
    .select("user_id, name, email, phone, age, profile_pic_url, is_verified, emergency_contact")
    .single();
  if (error) throw error;
  return data;
}
