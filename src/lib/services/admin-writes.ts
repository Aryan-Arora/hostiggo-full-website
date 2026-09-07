import { supabaseAdmin } from "../supabase-admin";

// All functions here run with the service-role key (RLS bypassed) and must only
// be called from /app/api/* route handlers.

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
    .select("host_uuid")
    .eq("listing_id", input.listingId)
    .maybeSingle();
  if (lerr) throw lerr;
  if (!listing?.host_uuid) throw new Error("Listing not found");

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
      amount: input.amount ?? null,
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
  photoUrls?: string[];
  // Index into photoUrls of the host's chosen cover. Falls back to the first
  // photo when omitted (Rule A). The wizard reorders the cover to index 0, so 0
  // is the safe default, but honouring an explicit index keeps other paths
  // (imports, admin tools) from picking the wrong cover.
  coverIndex?: number;
  checkInTime?: string;
  checkOutTime?: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  locationId?: number;
  // Structured location. When locationId is absent, createListing find-or-creates
  // a canonical `locations` row from these so location_id is never left null.
  city?: string;
  state?: string;
  pincode?: number;
  currency?: string;
};

// Canonical dedup key for a location: diacritic-, case- and space-insensitive
// (so "Haryāna"==="haryana", "Dehradun"==="dehradun").
const locationKey = (state?: string | null, district?: string | null) => {
  const n = (s: string | null | undefined) =>
    String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  return `${n(state)}|${n(district)}`;
};

// Find an existing locations row matching (state, city) or create one.
// Returns the location_id, or null when state/city are missing.
export async function resolveLocationId(
  state?: string | null,
  city?: string | null,
  pincode?: number | null,
): Promise<number | null> {
  if (!state?.trim() || !city?.trim()) return null;
  const wanted = locationKey(state, city);

  const { data: rows, error } = await supabaseAdmin
    .from("locations")
    .select("location_id, state, district");
  if (error) {
    console.error("[resolveLocationId] lookup failed:", error.message);
    return null;
  }
  const match = (rows ?? []).find((l) => locationKey(l.state, l.district) === wanted);
  if (match) return match.location_id;

  const { data: created, error: cErr } = await supabaseAdmin
    .from("locations")
    .insert({
      state: state.trim(),
      district: city.trim(),
      lower_division_name: city.trim(),
      lower_division_type: "city",
      pincode: pincode ?? null,
    })
    .select("location_id")
    .single();
  if (cErr) {
    console.error("[resolveLocationId] create failed:", cErr.message);
    return null;
  }
  return created.location_id;
}

export async function createListing(draft: ListingDraft) {
  // Resolve the owning host from the user.
  const { data: host, error: herr } = await supabaseAdmin
    .from("host")
    .select("host_uuid")
    .eq("user_id", draft.userId)
    .maybeSingle();
  if (herr) throw herr;
  if (!host?.host_uuid) throw new Error("No host profile for this user");

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
    host_uuid: host.host_uuid,
    is_active: false, // new listings start inactive (pending review)
    currency: draft.currency ?? "INR",
    check_in_time: draft.checkInTime ?? "14:00:00",
    check_out_time: draft.checkOutTime ?? "11:00:00",
    address_line1: draft.addressLine1 ?? null,
    address_line2: draft.addressLine2 ?? null,
    landmark: draft.landmark ?? null,
    created_at: now,
    updated_at: now,
  };
  // Prefer an explicit locationId; otherwise find-or-create from city/state so
  // the listing is never saved without a resolvable location.
  const locationId =
    draft.locationId ?? (await resolveLocationId(draft.state, draft.city, draft.pincode));
  if (locationId) row.location_id = locationId;

  const { data: listing, error } = await supabaseAdmin
    .from("listings")
    .insert(row)
    .select("listing_id, title")
    .single();
  if (error) throw error;

  const listingId = listing.listing_id;

  // Amenities (join rows).
  if (draft.amenityIds?.length) {
    const amenRows = draft.amenityIds.map((amenity_id) => ({ listing_id: listingId, amenity_id }));
    const { error: aerr } = await supabaseAdmin.from("listing_amenities").insert(amenRows);
    if (aerr) console.error("[createListing] amenities insert failed:", aerr.message);
  }

  // Photos (media rows). Persist the host's chosen cover explicitly (Rule A):
  // derive is_cover from coverIndex, falling back to the first photo only when
  // no valid index is supplied — never leave the cover to array position alone.
  if (draft.photoUrls?.length) {
    const coverIdx =
      draft.coverIndex != null &&
      draft.coverIndex >= 0 &&
      draft.coverIndex < draft.photoUrls.length
        ? draft.coverIndex
        : 0;
    const mediaRows = draft.photoUrls.map((media_url, i) => ({
      listing_id: listingId,
      media_url,
      media_type: "image",
      is_cover: i === coverIdx,
    }));
    const { error: merr } = await supabaseAdmin.from("listing_media").insert(mediaRows);
    if (merr) console.error("[createListing] media insert failed:", merr.message);
  }

  return { listing_id: listingId, title: listing.title };
}

// ── Cover photo ──────────────────────────────────────────────────────────────
// Rule B (single source of truth): clear the listing's existing cover(s), then
// flag the chosen media row — so there is always exactly one is_cover per
// listing. Scoped to the listing so a stale or foreign mediaId can never flip
// another listing's cover.
export async function setCoverPhoto(listingId: number, mediaId: string) {
  // Confirm the target photo actually belongs to this listing before writing.
  const { data: target, error: findErr } = await supabaseAdmin
    .from("listing_media")
    .select("id")
    .eq("listing_id", listingId)
    .eq("id", mediaId)
    .maybeSingle();
  if (findErr) throw findErr;
  if (!target) throw new Error("Photo not found for this listing");

  // Clear the current cover(s) for the listing.
  const { error: clearErr } = await supabaseAdmin
    .from("listing_media")
    .update({ is_cover: false })
    .eq("listing_id", listingId)
    .eq("is_cover", true);
  if (clearErr) throw clearErr;

  // Flag the chosen row as the new cover.
  const { error: setErr } = await supabaseAdmin
    .from("listing_media")
    .update({ is_cover: true })
    .eq("id", mediaId);
  if (setErr) throw setErr;

  return { success: true };
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
