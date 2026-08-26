import { supabase, supabaseCacheable } from '../supabase';
import { supabaseAdmin } from '../supabase-admin';
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
  // Only reached via the unstable_cache-wrapped getCachedHotelsTeaser
  // (src/lib/services/cached-reference-data.ts) -- uses supabaseCacheable
  // (no forced no-store) so this stays compatible with static generation.
  getHotels: async () => {
    const { data, error } = await supabaseCacheable
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

  // Only reached via getCachedLocations (cached-reference-data.ts) --
  // supabaseCacheable, see note on getHotels above.
  getLocationSample: async (limit: number = 22): Promise<LocationRow[]> => {
    const { data, error } = await supabaseCacheable
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

  // Ranks locations by how many active listings they have -- used for the
  // home page's "Popular in <city>" sections instead of a random sample.
  // Only reached via getCachedLocations -- supabaseCacheable, see note on
  // getHotels above.
  getPopularLocations: async (limit: number = 4): Promise<LocationRow[]> => {
    const { data, error } = await supabaseCacheable
      .from('listings')
      .select('location_id, locations (location_id, state, district, lower_division_name)')
      .eq('is_active', true)
      .not('location_id', 'is', null);

    if (error) {
      console.error('Fetch error (getPopularLocations):', error);
      throw error;
    }

    const counts = new Map<number, { row: LocationRow; count: number }>();
    for (const listing of (data || []) as any[]) {
      const loc = listing.locations;
      if (!loc?.location_id) continue;
      const existing = counts.get(loc.location_id);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(loc.location_id, {
          row: {
            location_id: loc.location_id,
            state: loc.state,
            district: loc.district,
            lower_division_name: loc.lower_division_name,
          },
          count: 1,
        });
      }
    }

    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((entry) => entry.row);
  },

  // Only reached via getHotelsByLocationId <- getCachedHotelsTeaser
  // (cached-reference-data.ts) -- supabaseCacheable, see note on getHotels
  // above.
  getListingsByLocationId: async (
    locationId: number,
    limit: number = 6,
    offset: number = 0,
  ): Promise<ListingRow[]> => {
    const { data, error } = await supabaseCacheable
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

  // Listings whose location matches a district name (case-insensitive). Used as
  // a fallback for the search flow: the `search_listings` RPC currently returns
  // nothing for some districts (e.g. New Delhi) even though active listings
  // exist there, so a plain destination search can query them directly.
  // TODO: remove once the search_listings RPC district matching is fixed.
  getListingsByDistrict: async (
    district: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<ListingRow[]> => {
    // Resolve matching location ids first (filtering listings on an embedded
    // location column is unreliable via PostgREST), then fetch listings in those
    // locations, mirroring the proven getListingsByLocationId path.
    const { data: locs, error: locErr } = await supabase
      .from('locations')
      .select('location_id')
      .ilike('district', district)
      .limit(1000);

    if (locErr) {
      console.error('Fetch error (getListingsByDistrict/locations):', locErr);
      throw locErr;
    }

    const locationIds = (locs || []).map((l: any) => l.location_id);
    if (locationIds.length === 0) return [];

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
      .in('location_id', locationIds)
      .eq('listing_media.is_cover', true)
      .order('listing_id', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Fetch error (getListingsByDistrict/listings):', error);
      throw error;
    }

    return (data || []) as ListingRow[];
  },

  // Listings owned by a given user (resolves host_uuid via the host table).
  // Paginated via offset/limit so hosts with more than a page of listings
  // (the demo host has 150+) aren't silently capped.
  getListingsByHost: async (
    userId: string,
    offset: number = 0,
    limit: number = 24,
  ): Promise<{ data: any[]; total: number }> => {
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
      return { data: [], total: 0 };
    }

    const { data, error, count } = await supabase
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
        { count: 'exact' },
      )
      .eq('host_uuid', host.host_uuid)
      .order('listing_id', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Fetch error (getListingsByHost/listings):', error);
      throw error;
    }
    return { data: data || [], total: count ?? 0 };
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

  filterHotelsByState: async (
    filters: SearchFilters,
    cursor: number | null = null,
    pageSize: number = 50,
  ): Promise<{
    data: SearchListingRpcRow[];
    hasMore: boolean;
    totalCount: number;
    stateBounds: any;
  }> => {
    const amenityIds = filters.amenities ? filters.amenities.map(Number) : [];
    const selectedRatings = filters.ratings || [];

    // Determine search scope: use state if provided, otherwise use district (location)
    const searchState = filters.state;
    const searchDistrict = filters.district;

    const { data, error, count } = await supabase.rpc('search_listings_by_state', {
      p_state: searchState || null,
      p_district: searchDistrict || null,
      p_cursor: cursor,
      p_start_date: filters.startDate,
      p_end_date: filters.endDate,
      p_min_price: filters.minPrice,
      p_max_price: filters.maxPrice,
      p_total_guests: filters.totalGuests,
      p_ratings: selectedRatings,
      p_amenities: amenityIds,
      p_roomtypes: filters.roomTypes,
      p_limit: pageSize,
    }, { count: 'exact' });

    if (error) {
      console.error('[filterHotelsByState] RPC error:', JSON.stringify(error, null, 2));
      throw error;
    }

    // Get state boundaries for map (if state-level search). District
    // searches (the common case -- see searchByState in src/lib/api.ts,
    // which always sends `district` since the destination search box only
    // ever collects city/district text) don't have a `searchState` to key
    // off, so fall back to the state of the first matched listing -- every
    // row in a district search is necessarily within one state anyway.
    const boundsLookupState = searchState || data?.[0]?.listing?.locations?.state;
    let stateBounds = null;
    if (boundsLookupState) {
      // supabase-js's select-string type parser can't resolve a raw SQL
      // function call like `ST_AsGeoJSON(boundary) as boundary` -- it infers
      // a ParserError type for the row even though PostgREST runs it fine.
      // Override with the actual shape instead of widening to `any`.
      const { data: locationData } = (await supabase
        .from('locations')
        .select('state, ST_AsGeoJSON(boundary) as boundary')
        .eq('state', boundsLookupState)
        .maybeSingle()) as { data: { state: string; boundary: string | null } | null };

      if (locationData?.boundary) {
        try {
          const geoJSON = JSON.parse(locationData.boundary);
          const coordinates = geoJSON.coordinates?.[0] || [];
          if (coordinates.length > 0) {
            const lats = coordinates.map((c: any) => c[1]);
            const lngs = coordinates.map((c: any) => c[0]);
            stateBounds = {
              north: Math.max(...lats),
              south: Math.min(...lats),
              east: Math.max(...lngs),
              west: Math.min(...lngs),
            };
          }
        } catch (e) {
          console.warn('[filterHotelsByState] Failed to parse boundary:', e);
        }
      }
    }

    const hasMore = (data?.length || 0) === pageSize;

    return {
      data: (data || []) as SearchListingRpcRow[],
      hasMore,
      totalCount: count || 0,
      stateBounds,
    };
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

    // Uses the admin client, not the anon `supabase` client used elsewhere
    // in this file -- unlike the RPC-backed search functions (which run as
    // SECURITY DEFINER and bypass RLS regardless of caller), this is a
    // direct table select with nested embeds (listing_addons,
    // listing_discounts). If RLS on those child tables doesn't grant the
    // anon role read access, Supabase doesn't error -- it silently returns
    // an empty array for that embed while the rest of the row loads fine,
    // which is exactly why host-added addons weren't showing up on the
    // guest-facing property page.
    const { data, error } = await supabaseAdmin
      .from('listings')
      .select(
        `
        *,
        locations (*),
        listing_media (media_url, is_cover),
        review (*),
        listing_amenities (
          amenities (name)
        ),
        listing_discounts (
          id, discount_type, percent, enabled
        ),
        listing_addons (
          id, price, includes, timing_from, timing_to, additional_notes,
          addons (addon_id, name, icon, category)
        )
      `,
      )
      .eq('listing_id', listingId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.error(
        `[getHotelDetail] Query failed for id=${id}:`,
        error?.message,
      );
      return null;
    }

    // listing_house_rules and listing_safety_details have RLS policies that
    // block the anon client's SELECT entirely (confirmed live, rows exist
    // but the anon key always sees an empty result), unlike the other
    // tables joined above. Fetch these two with the service-role client
    // instead so real host-entered data actually reaches the guest page.
    // Note: use a plain array select + take [0], not .maybeSingle(), in
    // this Promise.all/dev-server context .maybeSingle() reproducibly
    // returned null even though the row genuinely exists (confirmed via an
    // isolated script and a plain array query against the identical
    // filter); the array form doesn't have that problem.
    const [houseRules, safetyDetails] = await Promise.all([
      supabaseAdmin
        .from('listing_house_rules')
        .select('check_in_time, check_out_time, smoking_allowed, pets_allowed, parties_allowed, quiet_hours')
        .eq('listing_id', listingId),
      supabaseAdmin
        .from('listing_safety_details')
        .select('id, enabled, safety_features (feature_id, name, icon, description)')
        .eq('listing_id', listingId),
    ]);

    return {
      ...data,
      listing_house_rules: houseRules.data?.[0] ?? null,
      listing_safety_details: safetyDetails.data ?? [],
    };
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
