import { supabaseAdmin } from "../supabase-admin";

// All functions here run with the service-role key (RLS bypassed) and must only
// be called from /app/api/* route handlers.

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
      status_id: 1, // pending — awaiting host approval
      host_uuid: listing.host_uuid,
      booked_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
