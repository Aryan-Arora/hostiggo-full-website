import { supabase } from "../supabase";

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

export const bookingsAPI = {
  async fetchGuestBookings(
    userId: string,
    bookingLabel: "upcoming" | "completed" | "cancelled",
    page: number = 0,
    limit: number = 20,
  ) {
    const from = page * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from("user_bookings_detailed")
      .select(
        `
        booking_id,
        start_date,
        end_date,
        status_name,
        listing_title,
        cover_photo_url,
        booking_label
      `,
      )
      .eq("user_id", userId)
      .eq("booking_label", bookingLabel)
      .range(from, to)
      .order("start_date", { ascending: bookingLabel === "upcoming" });

    if (error) throw error;
    return data || [];
  },

  async fetchGuestBookingDetail(bookingId: string | number) {
    const { data, error } = await supabase
      .from("user_bookings_detailed")
      .select("*")
      .eq("booking_id", Number(bookingId))
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createReview(payload: {
    listing_id: number;
    user_id: string;
    rating: number;
    comment?: string | null;
  }) {
    const { data, error } = await supabase
      .from("review")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  },

  async fetchBookings(userId: string) {
    const { data: hostData, error: hostError } = await supabase
      .from("host")
      .select("host_uuid")
      .eq("user_id", userId)
      .single();

    if (hostError || !hostData) {
      console.warn("Could not find host profile for user:", userId, hostError);
      return [];
    }

    const hostUuid = hostData.host_uuid;
    const { data, error } = await supabase
      .from("bookings")
      .select(`*, property:listings(*)`)
      .eq("host_uuid", hostUuid);

    if (error) throw error;
    return data;
  },

  // Single booking for the host detail view. There is no FK from bookings to
  // users in the schema cache, so the guest profile is fetched separately.
  async getBookingDetail(bookingId: string | number) {
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(
        `
        *,
        property:listings (
          listing_id,
          title,
          price_weekday,
          currency,
          num_bedrooms,
          num_beds,
          num_bathrooms,
          num_guests,
          check_in_time,
          check_out_time,
          locations (state, district),
          listing_media (media_url, is_cover)
        )
      `,
      )
      .eq("booking_id", Number(bookingId))
      .maybeSingle();

    if (error) throw error;
    if (!booking) return null;

    let guest = null;
    if (booking.user_id) {
      const { data: guestRow } = await supabase
        .from("users")
        .select("name, phone, profile_pic_url, is_verified, created_at")
        .eq("user_id", booking.user_id)
        .maybeSingle();
      guest = guestRow ?? null;
    }

    return { ...booking, guest };
  },

  async updateBookingStatus(
    bookingId: string | number,
    status: string,
    _cancelledBy: "host" | "user" = "user",
    _reason?: string,
  ) {
    const updateData: any = {};

    if (status.toLowerCase() === "cancelled") {
      updateData.status_id = 3;
      if (_reason) updateData.cancellation_reason = _reason;
    } else if (status.toLowerCase() === "confirmed") {
      updateData.status_id = 2;
    } else if (status.toLowerCase() === "pending") {
      updateData.status_id = 1;
    }

    const { data, error } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("booking_id", Number(bookingId))
      .select("booking_id, status_id, listing_id, start_date, end_date")
      .single();

    if (error) throw error;

    // Release the calendar nights this booking had blocked — otherwise a
    // guest cancelling from "My Trips" (a different code path than the
    // host-side cancelBooking) leaves those dates unavailable forever.
    if (
      status.toLowerCase() === "cancelled" &&
      data?.listing_id &&
      data.start_date &&
      data.end_date
    ) {
      const nights = eachDateInRange(data.start_date, data.end_date);
      if (nights.length) {
        await supabase
          .from("listing_calendar")
          .update({ is_available: true, updated_at: new Date().toISOString() })
          .eq("listing_id", data.listing_id)
          .in("date", nights);
      }
    }

    return data;
  },

  async updateBookingDates(bookingId: string | number, checkIn: string, checkOut: string) {
    const formattedCheckIn = checkIn.split("T")[0];
    const formattedCheckOut = checkOut.split("T")[0];

    const { data: existing, error: fetchErr } = await supabase
      .from("bookings")
      .select("listing_id, start_date, end_date")
      .eq("booking_id", Number(bookingId))
      .single();
    if (fetchErr) throw fetchErr;

    // Same conflict checks createBooking runs — otherwise "modify dates"
    // can move a booking onto already-blocked or already-booked nights.
    const { data: blocked, error: blockedErr } = await supabase
      .from("listing_calendar")
      .select("date")
      .eq("listing_id", existing.listing_id)
      .gte("date", formattedCheckIn)
      .lt("date", formattedCheckOut)
      .eq("is_available", false);
    if (blockedErr) throw blockedErr;
    if (blocked && blocked.length > 0) {
      throw new Error("Some of the selected dates are not available.");
    }

    const { data: conflicts, error: conflictsErr } = await supabase
      .from("bookings")
      .select("booking_id")
      .eq("listing_id", existing.listing_id)
      .eq("status_id", 2)
      .neq("booking_id", Number(bookingId))
      .lt("start_date", formattedCheckOut)
      .gt("end_date", formattedCheckIn);
    if (conflictsErr) throw conflictsErr;
    if (conflicts && conflicts.length > 0) {
      throw new Error("These dates are already booked.");
    }

    const { data, error } = await supabase
      .from("bookings")
      .update({ start_date: formattedCheckIn, end_date: formattedCheckOut })
      .eq("booking_id", Number(bookingId))
      .select()
      .single();

    if (error) throw error;

    // Release the old nights and block the new ones so the calendar stays
    // in sync with the booking's actual dates.
    const now = new Date().toISOString();
    const oldNights = eachDateInRange(existing.start_date, existing.end_date);
    if (oldNights.length) {
      await supabase
        .from("listing_calendar")
        .update({ is_available: true, updated_at: now })
        .eq("listing_id", existing.listing_id)
        .in("date", oldNights);
    }
    const newNights = eachDateInRange(formattedCheckIn, formattedCheckOut);
    if (newNights.length) {
      const { data: existingRows } = await supabase
        .from("listing_calendar")
        .select("date")
        .eq("listing_id", existing.listing_id)
        .in("date", newNights);
      const existingDates = new Set((existingRows ?? []).map((r: any) => r.date));
      if (existingRows?.length) {
        await supabase
          .from("listing_calendar")
          .update({ is_available: false, updated_at: now })
          .eq("listing_id", existing.listing_id)
          .in("date", newNights);
      }
      const missing = newNights.filter((d) => !existingDates.has(d));
      if (missing.length) {
        await supabase.from("listing_calendar").insert(
          missing.map((date) => ({
            listing_id: existing.listing_id,
            date,
            is_available: false,
            price: 0,
            currency: "INR",
          })),
        );
      }
    }

    return data;
  },

  async updateBookingGuests(
    bookingId: string | number,
    adults: number,
    children: number,
    _pets: number = 0,
  ) {
    const { data: existing, error: fetchErr } = await supabase
      .from("bookings")
      .select("listing_id, listings(num_guests)")
      .eq("booking_id", Number(bookingId))
      .single();
    if (fetchErr) throw fetchErr;

    const maxGuests = Number((existing as any)?.listings?.num_guests ?? 1);
    if (adults + children > maxGuests) {
      throw new Error(`This listing only accommodates up to ${maxGuests} guests.`);
    }

    const { data, error } = await supabase
      .from("bookings")
      .update({
        num_adults: adults,
        num_children: children,
        nom_guests: adults + children,
      })
      .eq("booking_id", Number(bookingId))
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async addBookingAddon(bookingId: string, addon: any) {
    const { data, error } = await supabase
      .from("booking_addons")
      .insert([
        {
          booking_id: bookingId,
          name: addon.name,
          price: addon.price,
          type: addon.type,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
