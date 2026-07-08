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

const buildHost = (row: any): Host => ({
  id: String(row?.host_uuid ?? row?.host?.id ?? ""),
  name: row?.host?.name ?? "Host",
  avatar: row?.host?.photo ?? "https://i.pravatar.cc/150",
  rating: Number(row?.host?.rating ?? 0),
  tripsHosted: Number(row?.host?.tripsHosted ?? 0),
  joinDate: row?.host?.joinDate ?? "",
  responseRate: Number(row?.host?.responseRate ?? 99),
  responseTime: row?.host?.responseTime ?? "Within a day",
  isSuperhost: true,
});

export function mapListingToProperty(input: any): Property {
  const row = input?.listing ?? input ?? {};
  const location = row.locations ?? {};
  const images = mediaUrls(row);
  const amenities = amenityNames(row);
  const reviews = buildReviews(row);
  const rating = Number(row.avg_rating ?? row.rating ?? 0);

  return {
    id: String(row.listing_id ?? row.id ?? ""),
    propertyName: row.title ?? row.propertyName ?? "Untitled stay",
    city: row.district ?? location.district ?? row.city ?? "Unknown",
    state: row.state ?? location.state ?? row.state_name ?? "",
    price: Number(row.price_weekday ?? row.price ?? 0),
    rating,
    reviewCount: Number(row.review_count ?? reviews.length ?? 0),
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

  return {
    id: String(item.booking_id),
    title: item.listing_title ?? "Booked stay",
    image: item.cover_photo_url || FALLBACK_IMAGE,
    location: item.location ?? "",
    distanceText: item.distanceText ?? "Location available after booking",
    checkIn,
    checkOut,
    status: status === "completed" || status === "cancelled" ? status : "upcoming",
    coordinates: {
      lat: Number(item.latitude ?? 22.5937),
      lng: Number(item.longitude ?? 78.9629),
    },
    guests: {
      adults: Number(item.num_adults ?? 1),
      children: Number(item.num_children ?? 0),
      rooms: 1,
      pets: false,
    },
    addons: [
      { id: "breakfast", label: "Breakfast", emoji: "🍳", price: 500, selected: false },
      { id: "airport", label: "Airport Pickup", emoji: "🚗", price: 1200, selected: false },
      { id: "extrabed", label: "Extra Bed", emoji: "🛏️", price: 800, selected: false },
      { id: "earlycheckin", label: "Early Check-in", emoji: "⏰", price: 600, selected: false },
    ],
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
  bookingDetail: (id: string) =>
    request<any>(`/api/bookings/details?id=${encodeURIComponent(id)}`),
  hostCalendar: (listingId: string | number, start: string, end: string) =>
    request<{ entries: any[]; bookings: any[] }>(
      `/api/host/calendar?listingId=${encodeURIComponent(String(listingId))}&start=${start}&end=${end}`,
    ),
  updateCalendarDay: (payload: {
    listingId: string | number;
    date: string;
    price?: number;
    isAvailable?: boolean;
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
    amount?: number;
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
    request<{ listing_id: number; title: string }>(`/api/host/listings`, {
      method: "POST",
      body: JSON.stringify(draft),
    }),
  cancelBooking: (bookingId: string | number, reason?: string) =>
    request<any>(`/api/bookings/cancel`, {
      method: "POST",
      body: JSON.stringify({ bookingId, reason }),
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
  locations: (limit = 40, q?: string) => request<any[]>(`/api/locations?limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ""}`),
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
    console.log("[api.search] Request payload:", payload);
    const result = await request<any[]>("/api/search", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    console.log("[api.search] Response rows:", result?.length);
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
  addWishlistItem: (userId: string, listingId: string, categoryId?: string) =>
    request<any>("/api/wishlist", {
      method: "POST",
      body: JSON.stringify({
        action: "add",
        user_id: userId,
        listing_id: listingId,
        ...(categoryId ? { category_id: categoryId } : {}),
      }),
    }),
  wishlistCategories: (userId: string) =>
    request<any[]>(`/api/wishlist?resource=categories&userId=${encodeURIComponent(userId)}`),
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
  renameWishlistCategory: (categoryId: string, name: string) =>
    request<any>("/api/wishlist", {
      method: "PATCH",
      body: JSON.stringify({ categoryId, name }),
    }),
  deleteWishlistCategory: (categoryId: string) =>
    request<boolean>("/api/wishlist", {
      method: "DELETE",
      body: JSON.stringify({ categoryId }),
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
  updateBookingDates: (bookingId: string, checkIn: Date, checkOut: Date) =>
    request<any>("/api/bookings", {
      method: "PATCH",
      body: JSON.stringify({
        action: "dates",
        bookingId,
        checkIn: toISODate(checkIn),
        checkOut: toISODate(checkOut),
      }),
    }),
  updateBookingGuests: (bookingId: string, guests: { adults: number; children: number; pets?: number }) =>
    request<any>("/api/bookings", {
      method: "PATCH",
      body: JSON.stringify({
        action: "guests",
        bookingId,
        adults: guests.adults,
        children: guests.children,
        pets: guests.pets ?? 0,
      }),
    }),
  updateBookingStatus: (bookingId: string, status: "pending" | "confirmed" | "cancelled", reason?: string) =>
    request<any>("/api/bookings", {
      method: "PATCH",
      body: JSON.stringify({ action: "status", bookingId, status, reason }),
    }),
  // iCal integration
  registerICalFeed: (payload: { listingId: string | number; icalUrl: string; action: "add" | "update" | "deactivate" }) =>
    request<any>("/api/host/calendar/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getICalStatus: (listingId: string | number) =>
    request<any>(`/api/host/calendar/status?listingId=${encodeURIComponent(String(listingId))}`),
};
