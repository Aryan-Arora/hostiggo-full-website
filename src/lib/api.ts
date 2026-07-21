import type { AmenityItem, Host, Property, Review, SearchFilters } from "@/types";
import { supabase } from "@/lib/supabase";
import { toISODate } from "@/lib/utils";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop&q=80";

export const AUTH_USER_ID_KEY = "hostiggo:user-id";
export const AUTH_PHONE_KEY = "hostiggo:phone";
export const AUTH_EMAIL_KEY = "hostiggo:email";

type ApiResult<T> = { data?: T; error?: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const payload = (await res.json().catch(() => ({}))) as ApiResult<T>;
  if (!res.ok || payload.error) {
    throw new Error(payload.error || `Request failed: ${res.status}`);
  }
  return payload.data as T;
}

const first = <T>(value: T | T[] | null | undefined): T | undefined =>
  Array.isArray(value) ? value[0] : value ?? undefined;

const mediaUrls = (row: any): string[] => {
  const media = row?.listing_media ?? row?.media ?? [];
  const urls = Array.isArray(media)
    ? media.map((item: any) => item?.media_url).filter(Boolean)
    : [];
  const cover = row?.cover_image_url || row?.cover_photo_url || row?.image;
  return [...new Set([cover, ...urls].filter(Boolean))];
};

const amenityNames = (row: any): string[] => {
  const direct = row?.amenity_names;
  if (Array.isArray(direct)) return direct.filter(Boolean);

  const joined = row?.listing_amenities;
  if (!Array.isArray(joined)) return [];

  return joined
    .map((item: any) => item?.amenities?.name || item?.amenity?.name || item?.name)
    .filter(Boolean);
};

const boolFromAmenity = (amenities: string[], needle: string) =>
  amenities.some((item) => item.toLowerCase().includes(needle));

const buildAmenityDetails = (amenities: string[]): AmenityItem[] =>
  amenities.map((name) => ({
    name,
    icon: boolFromAmenity([name], "wifi")
      ? "wifi"
      : boolFromAmenity([name], "parking")
        ? "car"
        : boolFromAmenity([name], "kitchen")
          ? "utensils"
          : boolFromAmenity([name], "air")
            ? "zap"
            : "mountain",
    available: true,
  }));

const buildReviews = (row: any): Review[] => {
  const reviews = row?.review ?? row?.reviews ?? [];
  if (!Array.isArray(reviews)) return [];

  return reviews.map((review: any) => ({
    id: String(review.review_id ?? review.id ?? crypto.randomUUID()),
    userName: review.users?.name ?? review.user_name ?? "Guest",
    userAvatar: review.user_avatar ?? "https://i.pravatar.cc/150",
    rating: Number(review.rating ?? 0),
    reviewText: review.comment ?? review.reviewText ?? "",
    reviewDate: review.reviewed_at ?? review.created_at ?? "",
  }));
};

// The `host` table has no response_rate/response_time/superhost columns at
// all -- those were previously hardcoded (99%, "Within a day", true for
// every host) and displayed as if real. Left undefined here instead so the
// UI can honestly omit them; only is_verified reflects a real column.
const buildHost = (row: any): Host => ({
  id: String(row?.host_uuid ?? row?.host?.id ?? ""),
  name: row?.host?.name ?? "Host",
  avatar: row?.host?.photo ?? "https://i.pravatar.cc/150",
  rating: Number(row?.host?.rating ?? 0),
  tripsHosted: Number(row?.host?.tripsHosted ?? 0),
  joinDate: row?.host?.joinDate ?? "",
  responseRate: row?.host?.responseRate != null ? Number(row.host.responseRate) : undefined,
  responseTime: row?.host?.responseTime ?? undefined,
  isSuperhost: Boolean(row?.host?.is_verified),
});

export function mapListingToProperty(input: any): Property {
  const row = input?.listing ?? input ?? {};
  const location = row.locations ?? {};
  const images = mediaUrls(row);
  const amenities = amenityNames(row);
  const reviews = buildReviews(row);
  // Prefer the live joined reviews over listings.avg_rating/review_count,
  // which are separately materialized columns that createReview never updates
  // and so go stale as soon as a new review is submitted.
  const rating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : Number(row.avg_rating ?? row.rating ?? 0);

  return {
    id: String(row.listing_id ?? row.id ?? ""),
    propertyName: row.title ?? row.propertyName ?? "Untitled stay",
    city: row.district ?? location.district ?? row.city ?? "Unknown",
    state: row.state ?? location.state ?? row.state_name ?? "",
    price: Number(row.price_weekday ?? row.price ?? 0),
    priceWeekend: Number(row.price_weekend ?? row.price_weekday ?? row.price ?? 0),
    rating,
    reviewCount: reviews.length > 0 ? reviews.length : Number(row.review_count ?? 0),
    amenities,
    amenityDetails: buildAmenityDetails(amenities),
    propertyType: row.property_type ?? row.propertyType ?? "Homestay",
    images: images.length > 0 ? images : [FALLBACK_IMAGE],
    maxGuests: Number(row.max_guests ?? row.nom_guests ?? row.total_guests ?? 2),
    isFavorite: Boolean(row.isFavorite),
    isNew: Boolean(row.is_new),
    distanceFromCenter:
      typeof input?.distance === "number" ? `${(input.distance / 1000).toFixed(1)} km` : row.distance,
    isInstantBook: row.booking_mode === "auto" || Boolean(row.isInstantBook),
    freeCancellation: Boolean(row.freeCancellation),
    cancellationPolicy: (row.cancellation_policy ?? "moderate") as Property["cancellationPolicy"],
    breakfast: boolFromAmenity(amenities, "breakfast"),
    parking: boolFromAmenity(amenities, "parking"),
    wifi: boolFromAmenity(amenities, "wifi"),
    ac: boolFromAmenity(amenities, "air") || boolFromAmenity(amenities, "ac"),
    pool: boolFromAmenity(amenities, "pool"),
    kitchen: boolFromAmenity(amenities, "kitchen"),
    balcony: boolFromAmenity(amenities, "balcony"),
    mountainView: boolFromAmenity(amenities, "mountain"),
    bedType: row.room_type ?? row.bed_type ?? "Double bed",
    description: row.description ?? "",
    coordinates:
      row.latitude && row.longitude
        ? { lat: Number(row.latitude), lng: Number(row.longitude) }
        : undefined,
    host: buildHost(row),
    reviews,
    // No per-category (cleanliness/accuracy/communication/location/checkIn/
    // value) rating exists anywhere in the schema — only a single overall
    // `rating` per review — so no ratingBreakdown is fabricated here.
    houseRules: (() => {
      // listing_house_rules is one structured row per listing (booleans +
      // times), not a list of free-text rules — build readable strings
      // from it. Supabase may return it as an object or a 1-item array
      // depending on the relationship hint, so handle both.
      const hr = Array.isArray(row.listing_house_rules)
        ? row.listing_house_rules[0]
        : row.listing_house_rules;
      if (!hr) return undefined;
      const rules: string[] = [];
      rules.push(hr.smoking_allowed ? 'Smoking allowed' : 'No smoking');
      rules.push(hr.pets_allowed ? 'Pets allowed' : 'No pets');
      rules.push(hr.parties_allowed ? 'Parties or events allowed' : 'No parties or events');
      if (hr.quiet_hours) rules.push('Quiet hours enforced (10 PM – 8 AM)');
      if (hr.check_in_time) rules.push(`Check-in from ${String(hr.check_in_time).slice(0, 5)}`);
      if (hr.check_out_time) rules.push(`Check-out before ${String(hr.check_out_time).slice(0, 5)}`);
      return rules;
    })(),
    safetyFeatures: Array.isArray(row.listing_safety_details)
      ? row.listing_safety_details
          .filter((d: any) => d.enabled && d.safety_features)
          .map((d: any) => ({
            name: d.safety_features.name,
            icon: d.safety_features.icon,
            description: d.safety_features.description,
          }))
      : undefined,
    activeDiscount: (() => {
      const active = Array.isArray(row.listing_discounts)
        ? row.listing_discounts.find((d: any) => d.enabled)
        : null;
      return active ? { type: active.discount_type, percent: Number(active.percent ?? 0) } : null;
    })(),
    addons: Array.isArray(row.listing_addons)
      ? row.listing_addons
          .filter((a: any) => a.addons)
          .map((a: any) => ({
            addonId: a.addons.addon_id,
            name: a.addons.name,
            icon: a.addons.icon,
            category: a.addons.category,
            price: Number(a.price ?? 0),
            includes: a.includes ?? "",
            timingFrom: a.timing_from ?? null,
            timingTo: a.timing_to ?? null,
            notes: a.additional_notes ?? null,
          }))
      : undefined,
  };
}

export function mapWishlistListing(item: any) {
  const property = mapListingToProperty(item?.listing ?? item);
  return {
    id: property.id,
    name: property.propertyName,
    location: [property.city, property.state].filter(Boolean).join(", "),
    rating: property.rating,
    reviews: property.reviewCount,
    price: property.price,
    nights: 2,
    image: first(property.images) ?? FALLBACK_IMAGE,
    liked: true,
    group: item?.category_id ?? "all",
  };
}

export function mapBooking(item: any) {
  const checkIn = new Date(item.start_date);
  const checkOut = new Date(item.end_date);
  const status = String(item.booking_label ?? "upcoming").toLowerCase();

  // Only build real coordinates when the listing actually has them — the
  // guest-facing "Location" button previously defaulted to 22.5937,78.9629
  // (the geographic center of India) whenever they were missing, silently
  // sending guests to the wrong place instead of telling them it's unknown.
  const hasCoords = item.latitude != null && item.longitude != null;

  return {
    id: String(item.booking_id),
    title: item.listing_title ?? "Booked stay",
    image: item.cover_photo_url || FALLBACK_IMAGE,
    location: item.location ?? [item.district, item.state].filter(Boolean).join(", "),
    distanceText:
      item.distanceText ||
      [item.district, item.state].filter(Boolean).join(", ") ||
      "Location unavailable",
    checkIn,
    checkOut,
    status: status === "completed" || status === "cancelled" ? status : "upcoming",
    coordinates: hasCoords
      ? { lat: Number(item.latitude), lng: Number(item.longitude) }
      : null,
    guests: {
      adults: Number(item.num_adults ?? 1),
      children: Number(item.num_children ?? 0),
      rooms: 1,
      pets: false,
    },
  };
}

export const getStoredUserId = () =>
  typeof window === "undefined" ? null : window.localStorage.getItem(AUTH_USER_ID_KEY);

export const setStoredUserId = (userId: string) => {
  if (typeof window !== "undefined") window.localStorage.setItem(AUTH_USER_ID_KEY, userId);
};

export const clearStoredAuth = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_USER_ID_KEY);
  window.localStorage.removeItem(AUTH_PHONE_KEY);
  window.localStorage.removeItem(AUTH_EMAIL_KEY);
};

export type CurrentUser = {
  user_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  profile_pic_url: string | null;
  is_verified: boolean | null;
  is_active: boolean | null;
  age: number | null;
  emergency_contact: string | null;
  created_at: string | null;
  updated_at: string | null;
  email_notifications: boolean | null;
  sms_alerts: boolean | null;
  promo_notifications: boolean | null;
  host_message_notifications: boolean | null;
  show_profile_to_hosts: boolean | null;
  include_in_search: boolean | null;
  activity_status: boolean | null;
};

export const normalizePhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (phone.startsWith("+")) return phone;
  return `+${digits}`;
};

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const isUuid = (value?: string) =>
  Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));

export const api = {
  getUser: (userId: string) =>
    request<CurrentUser | null>(`/api/users?userId=${encodeURIComponent(userId)}`),
  hotels: () => request<any[]>("/api/hotels"),
  hotelsByLocation: (locationId: string | number, limit = 4) =>
    request<any[]>(`/api/hotels?locationId=${locationId}&limit=${limit}`),
  hostListings: async (
    userId: string,
    offset: number = 0,
    limit: number = 24,
  ): Promise<{ data: any[]; total: number }> => {
    const res = await fetch(
      `/api/host/listings?userId=${encodeURIComponent(userId)}&offset=${offset}&limit=${limit}`,
    );
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || payload.error) {
      throw new Error(payload.error || `Request failed: ${res.status}`);
    }
    return { data: payload.data ?? [], total: payload.total ?? 0 };
  },
  hostReviews: (userId: string) =>
    request<any[]>(`/api/host/reviews?userId=${encodeURIComponent(userId)}`),
  hostBookings: (userId: string) =>
    request<any[]>(`/api/bookings?role=host&userId=${encodeURIComponent(userId)}`),
  bookingDetail: (id: string, userId: string) =>
    request<any>(
      `/api/bookings/details?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(userId)}`,
    ),
  hostCalendar: (listingId: string | number, start: string, end: string) =>
    request<{ entries: any[]; bookings: any[] }>(
      `/api/host/calendar?listingId=${encodeURIComponent(String(listingId))}&start=${start}&end=${end}`,
    ),
  updateCalendarDay: (payload: {
    listingId: string | number;
    date: string;
    price?: number;
    isAvailable?: boolean;
    userId: string;
  }) =>
    request<any>(`/api/host/calendar`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  createBooking: (payload: {
    listingId: string | number;
    userId: string;
    startDate: string;
    endDate: string;
    numAdults?: number;
    numChildren?: number;
    addonIds?: number[];
    // amount is intentionally not accepted here — the server recomputes the
    // real charge from the listing's own prices, see createBooking() in
    // src/lib/services/admin-writes.ts
  }) =>
    request<any>(`/api/bookings/reserve`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  submitFeedback: (payload: {
    userId?: string | null;
    type: string;
    description: string;
    category?: string | null;
    rating?: number | null;
  }) =>
    request<any>(`/api/feedback`, { method: "POST", body: JSON.stringify(payload) }),
  updateProfile: (userId: string, patch: Record<string, any>) =>
    request<any>(`/api/users`, {
      method: "PATCH",
      body: JSON.stringify({ action: "update-profile", userId, patch }),
    }),
  createListing: (draft: Record<string, any>) =>
    request<{ listing_id: number; title: string; warnings?: string[] }>(`/api/host/listings`, {
      method: "POST",
      body: JSON.stringify(draft),
    }),
  cancelBooking: (bookingId: string | number, userId: string, reason?: string) =>
    request<any>(`/api/bookings/cancel`, {
      method: "POST",
      body: JSON.stringify({ bookingId, userId, reason }),
    }),
  createReview: (payload: {
    listingId: string | number;
    userId: string;
    rating: number;
    comment?: string;
  }) =>
    request<any>(`/api/reviews`, { method: "POST", body: JSON.stringify(payload) }),
  uploadPhoto: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/host/upload", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }
    const { data } = await response.json();
    return data.url;
  },
  uploadProfilePhoto: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/account/upload-photo", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }
    const { data } = await response.json();
    return data.url;
  },
  locations: (limit = 40, q?: string, popular = false) =>
    request<any[]>(
      `/api/locations?limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ""}${popular ? "&popular=1" : ""}`,
    ),
  propertyDetail: (id: string) => request<any>(`/api/hotels/${id}`),
  amenities: () => request<{ amenity_id: number; name: string }[]>("/api/amenities"),
  search: async (
    filters: SearchFilters,
    destination: string,
    page = 0,
    pageSize = 20,
    extra?: {
      startDate?: string | null;
      endDate?: string | null;
      totalGuests?: number;
      amenities?: number[];
      latitude?: number;
      longitude?: number;
    },
  ) => {
    const payload = {
      page,
      pageSize,
      filters: {
        startDate: extra?.startDate ?? null,
        endDate: extra?.endDate ?? null,
        district: destination?.trim() || undefined,
        minPrice: filters.priceMin > 0 ? filters.priceMin : undefined,
        maxPrice: filters.priceMax < 100000 ? filters.priceMax : undefined,
        totalGuests: extra?.totalGuests,
        ratings: filters.guestRating != null ? [filters.guestRating] : [],
        amenities: extra?.amenities ?? ([] as number[]),
        roomTypes: filters.propertyTypes,
        latitude: extra?.latitude ?? null,
        longitude: extra?.longitude ?? null,
      },
    };
    const result = await request<any[]>("/api/search", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return result;
  },
  sendOtp: (phone: string) =>
    request<any>("/api/auth/otp", {
      method: "POST",
      body: JSON.stringify({ action: "send", phone: normalizePhone(phone) }),
    }),
  sendEmailOtp: (email: string) =>
    request<any>("/api/auth/otp", {
      method: "POST",
      body: JSON.stringify({ action: "send", email: normalizeEmail(email) }),
    }),
  verifyOtp: (params: { phone?: string; email?: string; token: string }) =>
    request<any>("/api/auth/otp", {
      method: "POST",
      body: JSON.stringify({
        action: "verify",
        ...(params.phone ? { phone: normalizePhone(params.phone) } : {}),
        ...(params.email ? { email: normalizeEmail(params.email) } : {}),
        token: params.token,
        type: params.email ? "email" : "sms",
      }),
    }),
  wishlistCategories: (userId: string) =>
    request<any[]>(`/api/wishlist?resource=categories&userId=${encodeURIComponent(userId)}`),
  wishlistIds: (userId: string) =>
    request<{ listing_id: string }[]>(
      `/api/wishlist?resource=ids&userId=${encodeURIComponent(userId)}`,
    ),
  addWishlistItem: (userId: string, listingId: string | number, categoryId?: string) =>
    request<any>("/api/wishlist", {
      method: "POST",
      body: JSON.stringify({
        action: "add",
        user_id: userId,
        listing_id: String(listingId),
        ...(isUuid(categoryId) ? { category_id: categoryId } : {}),
      }),
    }),
  wishlistListings: (userId: string, categoryId?: string) =>
    request<any[]>(
      `/api/wishlist?resource=listings&userId=${encodeURIComponent(userId)}${
        isUuid(categoryId) ? `&categoryId=${encodeURIComponent(categoryId as string)}` : ""
      }`,
    ),
  createWishlistCategory: (userId: string, name: string) =>
    request<any>("/api/wishlist", {
      method: "POST",
      body: JSON.stringify({ action: "create-category", user_id: userId, name }),
    }),
  renameWishlistCategory: (categoryId: string, name: string, userId: string) =>
    request<any>("/api/wishlist", {
      method: "PATCH",
      body: JSON.stringify({ categoryId, name, userId }),
    }),
  deleteWishlistCategory: (categoryId: string, userId: string) =>
    request<boolean>("/api/wishlist", {
      method: "DELETE",
      body: JSON.stringify({ categoryId, userId }),
    }),
  removeWishlistItem: (userId: string, listingId: string, categoryId?: string) =>
    request<boolean>("/api/wishlist", {
      method: "DELETE",
      body: JSON.stringify({ userId, listingId, categoryId }),
    }),
  guestBookings: (userId: string, label: "upcoming" | "completed" | "cancelled") =>
    request<any[]>(
      `/api/bookings?role=guest&userId=${encodeURIComponent(userId)}&label=${label}&limit=50`,
    ),
  updateBookingDates: (bookingId: string, checkIn: Date, checkOut: Date, userId: string) =>
    request<any>("/api/bookings", {
      method: "PATCH",
      body: JSON.stringify({
        action: "dates",
        bookingId,
        userId,
        checkIn: toISODate(checkIn),
        checkOut: toISODate(checkOut),
      }),
    }),
  updateBookingGuests: (
    bookingId: string,
    guests: { adults: number; children: number; pets?: number },
    userId: string,
  ) =>
    request<any>("/api/bookings", {
      method: "PATCH",
      body: JSON.stringify({
        action: "guests",
        bookingId,
        userId,
        adults: guests.adults,
        children: guests.children,
        pets: guests.pets ?? 0,
      }),
    }),
  updateBookingStatus: (
    bookingId: string,
    status: "pending" | "confirmed" | "cancelled",
    reason: string | undefined,
    userId: string,
  ) =>
    request<any>("/api/bookings", {
      method: "PATCH",
      body: JSON.stringify({ action: "status", bookingId, status, reason, userId }),
    }),
  getRefundPreview: (bookingId: string | number, userId: string) =>
    request<any>(
      `/api/bookings/refund-preview?bookingId=${encodeURIComponent(String(bookingId))}&userId=${encodeURIComponent(userId)}`,
    ),
  cancelBookingWithRefund: (bookingId: string | number, userId: string, reason?: string) =>
    request<any>("/api/bookings/cancel-with-refund", {
      method: "POST",
      body: JSON.stringify({ bookingId, userId, reason }),
    }),
  // iCal integration
  registerICalFeed: (payload: { listingId: string | number; icalUrl: string; action: "add" | "update" | "deactivate"; userId: string }) =>
    request<any>("/api/host/calendar/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getICalStatus: (listingId: string | number, userId: string) =>
    request<any>(
      `/api/host/calendar/status?listingId=${encodeURIComponent(String(listingId))}&userId=${encodeURIComponent(userId)}`,
    ),
};
