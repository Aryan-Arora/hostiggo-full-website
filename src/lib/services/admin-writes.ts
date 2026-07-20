import { supabaseAdmin } from "../supabase-admin";
import { calculateBookingInvoice } from "../billing/invoice";

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

export async function uploadListingPhoto(
  file: {
    data: ArrayBuffer;
    name: string;
    type: string;
  },
  folder: string = "listings/uploads",
): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabaseAdmin.storage
    .from(LISTING_BUCKET)
    .upload(path, file.data, { contentType: file.type || "image/jpeg", upsert: false });
  if (error) throw error;
  const { data } = supabaseAdmin.storage.from(LISTING_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// ── Calendar ─────────────────────────────────────────────────────────────────
/**
 * Throws unless `requestingUserId` is the host who owns `listingId`.
 * Shared guard for host-side writes that previously trusted any client
 * that knew a listing_id integer.
 */
export async function assertListingOwnedBy(listingId: number, requestingUserId: string) {
  const { data: listing, error: listingError } = await supabaseAdmin
    .from("listings")
    .select("host_uuid")
    .eq("listing_id", listingId)
    .maybeSingle();
  if (listingError) throw listingError;
  if (!listing) throw new Error("Listing not found");

  const { data: host, error: hostError } = await supabaseAdmin
    .from("host")
    .select("user_id")
    .eq("host_uuid", listing.host_uuid)
    .maybeSingle();
  if (hostError) throw hostError;
  if (host?.user_id !== requestingUserId) {
    throw new Error("You don't have permission to modify this listing.");
  }
}

export async function upsertCalendarDay(input: {
  listingId: number;
  date: string; // yyyy-mm-dd
  price?: number;
  isAvailable?: boolean;
  currency?: string;
  requestingUserId: string;
}) {
  const { listingId, date, price, isAvailable, currency } = input;
  await assertListingOwnedBy(listingId, input.requestingUserId);

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
  // Guest picks *which* add-ons they want; the price for each is always
  // looked up server-side from listing_addons below, never trusted from
  // the client, same reasoning as `amount` never being accepted directly.
  addonIds?: number[];
  // `amount` is intentionally NOT accepted from the client anymore — the
  // charge is always recomputed here from the listing's real prices so a
  // guest can't submit an arbitrary (or zero) amount for a real booking.
}) {
  // Resolve the owning host + real pricing/capacity from the listing —
  // never trust client-supplied price or guest-count data for the charge.
  const { data: listing, error: lerr } = await supabaseAdmin
    .from("listings")
    .select("host_uuid, price_weekday, price_weekend, num_guests")
    .eq("listing_id", input.listingId)
    .maybeSingle();
  if (lerr) throw lerr;
  if (!listing?.host_uuid) throw new Error("Listing not found");

  const numAdults = input.numAdults ?? 1;
  const numChildren = input.numChildren ?? 0;
  const totalGuests = numAdults + numChildren;
  const maxGuests = Number(listing.num_guests ?? 1);
  if (totalGuests > maxGuests) {
    throw new Error(`This listing only accommodates up to ${maxGuests} guests.`);
  }

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

  // Recompute the charge server-side from the listing's real per-night
  // prices — weekend nights (Fri/Sat) use price_weekend, everything else
  // uses price_weekday — plus whichever add-ons the guest actually picked
  // (priced from listing_addons, never from the client) — run through the
  // real GST/service-fee invoice (src/lib/billing/invoice.ts) so the
  // stored amount always matches the exact number the guest was shown at
  // checkout, and can't be spoofed by the client.
  const stayNights = eachDateInRange(input.startDate, input.endDate);
  const priceWeekday = Number(listing.price_weekday ?? 0);
  const priceWeekend = Number(listing.price_weekend ?? priceWeekday);
  const subtotal = stayNights.reduce((sum, date) => {
    const dow = new Date(date + "T00:00:00Z").getUTCDay();
    const isWeekend = dow === 5 || dow === 6; // Friday or Saturday night
    return sum + (isWeekend ? priceWeekend : priceWeekday);
  }, 0);

  let resolvedAddons: { name: string; price: number; type: string | null }[] = [];
  if (input.addonIds?.length) {
    const { data: addonRows, error: addonErr } = await supabaseAdmin
      .from("listing_addons")
      .select("addon_id, price, addons(name, category)")
      .eq("listing_id", input.listingId)
      .in("addon_id", input.addonIds);
    if (addonErr) throw addonErr;
    resolvedAddons = (addonRows ?? []).map((a: any) => ({
      name: a.addons?.name ?? "Add-on",
      price: Number(a.price ?? 0),
      type: a.addons?.category ?? null,
    }));
  }
  const breakfastTotal = resolvedAddons
    .filter((a) => a.type?.toLowerCase().includes("breakfast"))
    .reduce((sum, a) => sum + a.price, 0);
  const otherServicesTotal = resolvedAddons
    .filter((a) => !a.type?.toLowerCase().includes("breakfast"))
    .reduce((sum, a) => sum + a.price, 0);

  const invoice = calculateBookingInvoice({
    basePropertyPrice: subtotal,
    breakfastPrice: breakfastTotal,
    otherServicesPrice: otherServicesTotal,
  });
  const amount = invoice.grandTotalRupees;

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
      amount,
      // booking_status only defines 2=CONFIRMED, 3=CANCELLED (no pending row),
      // so a new reservation is created as CONFIRMED.
      status_id: 2,
      host_uuid: listing.host_uuid,
      booked_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;

  // Record which add-ons were actually purchased with this booking (their
  // price is already folded into `amount` above; this is just the record
  // of which ones, for the guest/host to see later).
  if (resolvedAddons.length) {
    const { error: bookingAddonsErr } = await supabaseAdmin.from("booking_addons").insert(
      resolvedAddons.map((a) => ({
        booking_id: data.booking_id,
        name: a.name,
        price: a.price,
        type: a.type,
      })),
    );
    if (bookingAddonsErr) {
      console.error("[createBooking] booking_addons insert failed:", bookingAddonsErr.message);
    }
  }

  // Checks A/B above are check-then-insert, not atomic — two requests can
  // both pass them and both insert a CONFIRMED booking for overlapping
  // dates. There's no way to add a real DB-level exclusion constraint from
  // here (would need direct schema access this service doesn't have), so
  // instead re-check immediately after inserting: if another CONFIRMED
  // booking for the same listing/dates already existed before ours
  // (lower booking_id = arrived first), we lost the race — cancel the
  // booking we just created rather than leave two guests both holding a
  // "confirmed" reservation for the same nights. This shrinks the race
  // window from the whole request round-trip down to just this recheck,
  // it doesn't eliminate it outright.
  const { data: raceLosers, error: raceErr } = await supabaseAdmin
    .from("bookings")
    .select("booking_id")
    .eq("listing_id", input.listingId)
    .eq("status_id", 2)
    .neq("booking_id", data.booking_id)
    .lt("booking_id", data.booking_id)
    .lt("start_date", input.endDate)
    .gt("end_date", input.startDate);
  if (!raceErr && raceLosers && raceLosers.length > 0) {
    await supabaseAdmin
      .from("bookings")
      .update({ status_id: 3, cancellation_reason: "Dates were booked by another guest first" })
      .eq("booking_id", data.booking_id);
    throw new Error("These dates were just booked by someone else. Please choose different dates.");
  }

  // Block all nights in the booked range so they can't be double-booked.
  const nights = stayNights;
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
export async function cancelBooking(
  bookingId: number,
  reason: string | null | undefined,
  requestingUserId: string,
) {
  // Ownership check: only the guest who made the booking or the host of the
  // listing may cancel it. Without this, any client that guessed a booking_id
  // integer could cancel someone else's stay.
  const { data: booking, error: fetchError } = await supabaseAdmin
    .from("bookings")
    .select("booking_id, user_id, listing_id")
    .eq("booking_id", bookingId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!booking) throw new Error("Booking not found");

  if (booking.user_id !== requestingUserId) {
    const { data: listing, error: listingError } = await supabaseAdmin
      .from("listings")
      .select("host_uuid")
      .eq("listing_id", booking.listing_id)
      .maybeSingle();
    if (listingError) throw listingError;

    const { data: host, error: hostError } = await supabaseAdmin
      .from("host")
      .select("user_id")
      .eq("host_uuid", listing?.host_uuid ?? "")
      .maybeSingle();
    if (hostError) throw hostError;

    if (host?.user_id !== requestingUserId) {
      throw new Error("You don't have permission to cancel this booking.");
    }
  }

  const patch: Record<string, any> = { status_id: 3 }; // 3 = CANCELLED
  if (reason) patch.cancellation_reason = reason;
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .update(patch)
    .eq("booking_id", bookingId)
    .select("booking_id, status_id, cancellation_reason, listing_id, start_date, end_date")
    .single();
  if (error) throw error;

  // Release the calendar nights createBooking blocked for this reservation —
  // otherwise a cancelled booking's dates stay marked unavailable forever.
  if (data?.listing_id && data.start_date && data.end_date) {
    const nights = eachDateInRange(data.start_date, data.end_date);
    if (nights.length) {
      await supabaseAdmin
        .from("listing_calendar")
        .update({ is_available: true, updated_at: new Date().toISOString() })
        .eq("listing_id", data.listing_id)
        .in("date", nights);
    }
  }

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
  propertyType?: string;
  priceWeekday?: number;
  priceWeekend?: number;
  numGuests?: number;
  numBedrooms?: number;
  numBeds?: number;
  numBathrooms?: number;
  amenityIds?: number[];
  addonSelections?: { addon_id: number; price: number; includes: string }[];
  discounts?: { discount_type: string; percent: number; enabled: boolean }[];
  houseRules?: {
    check_in_time?: string;
    check_out_time?: string;
    smoking_allowed?: boolean;
    pets_allowed?: boolean;
    parties_allowed?: boolean;
    quiet_hours?: boolean;
  };
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

  if (draft.propertyType) {
    const { data: propType } = await supabaseAdmin
      .from("property_types")
      .select("id")
      .eq("type_id", draft.propertyType)
      .maybeSingle();
    if (propType) row.property_type_id = propType.id;
  }

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

  // Discounts picked in the wizard's pricing step.
  if (draft.discounts?.length) {
    const discountRows = draft.discounts.map((d) => ({
      listing_id: listingId,
      discount_type: d.discount_type,
      percent: d.percent,
      enabled: d.enabled,
    }));
    const { error: discountErr } = await supabaseAdmin.from("listing_discounts").insert(discountRows);
    if (discountErr) {
      console.error("[createListing] discounts insert failed:", discountErr.message);
      warnings.push("Your listing was created, but the discount settings failed to save.");
    }
  }

  // House rules set in the wizard's rules step (one structured row, not a list).
  if (draft.houseRules) {
    const { error: rulesErr } = await supabaseAdmin.from("listing_house_rules").insert({
      listing_id: listingId,
      ...draft.houseRules,
    });
    if (rulesErr) {
      console.error("[createListing] house rules insert failed:", rulesErr.message);
      warnings.push("Your listing was created, but the house rules failed to save.");
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
  patch: Partial<{
    name: string;
    email: string;
    phone: string;
    age: number;
    emergency_contact: string;
    profile_pic_url: string;
    email_notifications: boolean;
    sms_alerts: boolean;
    promo_notifications: boolean;
    host_message_notifications: boolean;
    show_profile_to_hosts: boolean;
    include_in_search: boolean;
    activity_status: boolean;
  }>,
) {
  // Runtime allowlist -- the Partial<> type above only constrains TS callers,
  // but the /api/users PATCH route forwards client JSON straight in, so
  // without this any users-table column (is_verified, is_active, ...) could
  // be written by name.
  const ALLOWED_PROFILE_FIELDS = new Set([
    "name",
    "email",
    "phone",
    "age",
    "emergency_contact",
    "profile_pic_url",
    "email_notifications",
    "sms_alerts",
    "promo_notifications",
    "host_message_notifications",
    "show_profile_to_hosts",
    "include_in_search",
    "activity_status",
  ]);
  const clean: Record<string, any> = { updated_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(patch)) {
    if (!ALLOWED_PROFILE_FIELDS.has(k)) continue;
    if (v !== undefined && v !== null && v !== "") clean[k] = v;
  }
  // select("*") rather than an explicit column list: the preference columns
  // below are added by a migration the operator applies separately (see
  // supabase/migrations), and an explicit list of not-yet-existing columns
  // would break this RETURNING clause -- and therefore every profile save,
  // including unrelated name/email/phone edits -- until that migration runs.
  const { data, error } = await supabaseAdmin
    .from("users")
    .update(clean)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
