import { supabase } from '../supabase';
import {
  SearchFilters,
  GuestlistingSearchResults,
  GuestlistingFullResults,
  LocationSummary,
  Review,
  RatingBreakdown,
} from '../../types/hotelServiceTypes';

export type SearchListingRpcRow = {
  listing: Record<string, any>;
  distance: number | null;
};

export type LocationRow = {
  location_id: number;
  state?: string | null;
  district?: string | null;
  lower_division_name?: string | null;
};

export type ListingRow = {
  listing_id: number;
  title: string;
  price_weekday: number;
  location_id: number;
  locations?: { state?: string | null; district?: string | null } | null;
  listing_media?:
    | { media_url?: string | null; is_cover?: boolean | null }[]
    | null;
};

export const HotelServiceApi = {
  getHotels: async () => {
    const { data, error } = await supabase
      .from('listings')
      .select(
        `
        listing_id,
        title,
        price_weekday,
        is_active,
        locations (state, district),
        listing_media (media_url)
      `,
      )
      .eq('is_active', true)
      .eq('listing_media.is_cover', true);

    if (error) {
      console.error('Fetch error:', error);
      return [];
    }

    return data;
  },

  getHotelsByLocationId: async (
    locationId: number,
    limit: number = 4,
  ): Promise<ListingRow[]> => {
    return HotelServiceApi.getListingsByLocationId(locationId, limit, 0);
  },

  getLocationSample: async (limit: number = 22): Promise<LocationRow[]> => {
    const { data, error } = await supabase
      .from('locations')
      .select('location_id, state, district, lower_division_name')
      .order('location_id', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Fetch error (getLocationSample):', error);
      throw error;
    }

    return (data || []) as LocationRow[];
  },

  getListingsByLocationId: async (
    locationId: number,
    limit: number = 6,
    offset: number = 0,
  ): Promise<ListingRow[]> => {
    const { data, error } = await supabase
      .from('listings')
      .select(
        `
        listing_id,
        title,
        price_weekday,
        location_id,
        locations (state, district),
        listing_media (media_url, is_cover)
      `,
      )
      .eq('is_active', true)
      .eq('location_id', locationId)
      .eq('listing_media.is_cover', true)
      .order('listing_id', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Fetch error (getListingsByLocationId):', error);
      throw error;
    }

    return (data || []) as ListingRow[];
  },

  // Listings owned by a given user (resolves host_uuid via the host table).
  getListingsByHost: async (userId: string): Promise<any[]> => {
    const { data: host, error: hostError } = await supabase
      .from('host')
      .select('host_uuid')
      .eq('user_id', userId)
      .maybeSingle();

    if (hostError) {
      console.error('Fetch error (getListingsByHost/host):', hostError);
      throw hostError;
    }
    if (!host?.host_uuid) {
      console.warn('[getListingsByHost] No host profile found for user:', userId);
      return [];
    }

    const { data, error } = await supabase
      .from('listings')
      .select(
        `
        listing_id,
        title,
        price_weekday,
        is_active,
        lisiting_status,
        locations (state, district),
        listing_media (media_url, is_cover)
      `,
      )
      .eq('host_uuid', host.host_uuid)
      .order('listing_id', { ascending: false })
      .limit(60);

    if (error) {
      console.error('Fetch error (getListingsByHost/listings):', error);
      throw error;
    }
    return data || [];
  },

  filterHotels: async (
    filters: SearchFilters,
    page: number = 0,
    pageSize: number = 10,
  ): Promise<SearchListingRpcRow[]> => {
    const offset = page * pageSize;
    const amenityIds = filters.amenities ? filters.amenities.map(Number) : [];
    const selectedRatings = filters.ratings || [];

    const { data, error } = await supabase.rpc('search_listings', {
      p_start_date: filters.startDate,
      p_end_date: filters.endDate,
      p_state: filters.state,
      p_district: filters.district,
      p_min_price: filters.minPrice,
      p_max_price: filters.maxPrice,
      p_total_guests: filters.totalGuests,
      p_ratings: selectedRatings,
      p_amenities: amenityIds,
      p_roomtypes: filters.roomTypes,
      p_lat: filters.latitude ?? null,
      p_lon: filters.longitude ?? null,
      p_limit: pageSize,
      p_offset: offset,
    });

    if (error) {
      console.error(
        '[filterHotels] RPC error:',
        JSON.stringify(error, null, 2),
      );
      throw error;
    }

    return (data || []) as SearchListingRpcRow[];
  },

  formatPrice: (price: number): string => {
    return `₹${price.toLocaleString('en-IN')}`;
  },

  getHotelDetail: async (id: string) => {
    const listingId = Number(id);

    if (isNaN(listingId)) {
      console.error(`[getHotelDetail] Invalid hotel ID: ${id}`);
      return null;
    }

    const { data, error } = await supabase
      .from('listings')
      .select(
        `
        *,
        locations (*),
        listing_media (media_url, is_cover),
        review (*),
        listing_amenities (
          amenities (name)
        )
      `,
      )
      .eq('listing_id', listingId)
      .single();

    if (error || !data) {
      console.error(
        `[getHotelDetail] Query failed for id=${id}:`,
        error?.message,
      );
      return null;
    }

    return data;
  },

  getAmenities: async () => {
    const { data, error } = await supabase
      .from('amenities')
      .select('amenity_id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Fetch error (getAmenities):', error);
      return [];
    }

    return data;
  },

  searchLocations: async (searchTerm: string) => {
    if (!searchTerm || !searchTerm.trim()) return [];

    const { data, error } = await supabase.rpc('search_locations_partial', {
      search_term: searchTerm.trim(),
    });

    if (error) {
      console.error('Search error (searchLocations - partial):', {
        error,
        searchTerm,
      });
      return [];
    }

    return data || [];
  },

  getUniqueRoomType: async () => {
    const { data, error } = await supabase.rpc('get_unique_room_types');
    if (error) {
      console.error('RPC error (getUniqueRoomType):', error);
      return [];
    }
    return data || [];
  },
};
