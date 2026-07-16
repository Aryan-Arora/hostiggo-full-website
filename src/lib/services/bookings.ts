import { supabase } from "../supabase";

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
    const rows = data || [];
    if (!rows.length) return rows;

    // user_bookings_detailed has no listing_id/coordinates/location at all,
    // so the guest-facing "Location" button had no real place to point to
    // and silently defaulted to the geographic center of India. Fetch the
    // real listing_id + coordinates + district/state for these bookings
    // and merge them in.
    const bookingIds = rows.map((r: any) => r.booking_id);
    const { data: withListing } = await supabase
      .from("bookings")
      .select(
        `
        booking_id,
        listings (
          latitude, longitude,
          locations (district, state)
        )
      `,
      )
      .in("booking_id", bookingIds);

    const byId = new Map(
      (withListing ?? []).map((r: any) => [r.booking_id, r.listings]),
    );

    return rows.map((r: any) => {
      const listing = byId.get(r.booking_id);
      return {
        ...r,
        latitude: listing?.latitude ?? null,
        longitude: listing?.longitude ?? null,
        district: listing?.locations?.district ?? null,
        state: listing?.locations?.state ?? null,
      };
    });
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
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateBookingDates(bookingId: string | number, checkIn: string, checkOut: string) {
    const formattedCheckIn = checkIn.split("T")[0];
    const formattedCheckOut = checkOut.split("T")[0];

    const { data, error } = await supabase
      .from("bookings")
      .update({ start_date: formattedCheckIn, end_date: formattedCheckOut })
      .eq("booking_id", Number(bookingId))
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateBookingGuests(
    bookingId: string | number,
    adults: number,
    children: number,
    _pets: number = 0,
  ) {
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
