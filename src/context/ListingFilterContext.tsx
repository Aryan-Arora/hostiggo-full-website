'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
  useEffect,
  useMemo,
} from 'react';
import type { Property, SearchFilters, SortOption, GuestCount } from '@/types';
import { api, mapListingToProperty } from '@/lib/api';

interface ListingState {
  properties: Property[];
  loading: boolean;
  error: string | null;
  filters: SearchFilters;
  location: {
    query: string;
    latitude?: number;
    longitude?: number;
  };
  dates: {
    checkIn: Date | null;
    checkOut: Date | null;
  };
  guests: GuestCount;
  sort: SortOption;
  pagination: {
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
  counts: {
    total: number;
  };
}

interface ListingActions {
  setSort: (sort: SortOption) => void;
  setPriceRange: (range: [number, number]) => void;
  setRating: (rating: number | null) => void;
  toggleAmenity: (amenity: string) => void;
  togglePropertyType: (type: string) => void;
  toggleBedType: (type: string) => void;
  setBooleanFilter: (key: keyof SearchFilters, value: boolean) => void;
  fetchMore: () => void;
  clearFilters: () => void;
  setLocation: (loc: {
    query: string;
    latitude?: number;
    longitude?: number;
  }) => void;
  setDates: (dates: { checkIn: Date | null; checkOut: Date | null }) => void;
  setGuests: (guests: GuestCount) => void;
  refresh: () => Promise<void>;
}

const ListingStateContext = createContext<ListingState | undefined>(undefined);
const ListingDispatchContext = createContext<ListingActions | undefined>(
  undefined,
);

const DEFAULT_PAGE_SIZE = 20;

const DEFAULT_FILTERS: SearchFilters = {
  priceMin: 0,
  priceMax: 100000,
  guestRating: null,
  propertyTypes: [],
  amenities: [],
  bedTypes: [],
  freeCancellation: false,
  breakfast: false,
  parking: false,
  wifi: false,
  ac: false,
  privateRoom: false,
  sharedRoom: false,
  doubleBed: false,
  coupleFriendly: false,
  familyFriendly: false,
};

const DEFAULT_GUESTS: GuestCount = {
  adults: 1,
  children: 0,
  rooms: 1,
  pets: false,
};

// yyyy-mm-dd in local time (avoids the UTC shift of toISOString).
const toISODate = (d: Date | null): string | null => {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// The Facilities checkboxes hold display labels (e.g. "Parking", "Pool") while
// the search RPC wants amenity ids. Each label is scored against the DB
// catalogue and the best match wins. Scoring prefers an exact name, then a
// head-noun match (the catalogue name's last word equals the label, so "Pool"
// → "Swimming Pool" rather than "Pool Table"), then a loose substring match.
// Unmatched labels (e.g. "Mountain view", which has no row) are dropped.
const scoreAmenity = (needle: string, name: string): number => {
  if (name === needle) return 100;
  const lastWord = name.split(/\s+/).pop() ?? '';
  if (lastWord === needle) return 50;
  if (name.includes(needle)) return 10;
  if (needle.includes(name)) return 5;
  return 0;
};

const resolveAmenityIds = (
  labels: string[],
  catalogue: { amenity_id: number; name: string }[],
): number[] => {
  if (!labels.length || !catalogue.length) return [];
  const ids: number[] = [];
  for (const label of labels) {
    const needle = label.trim().toLowerCase();
    let best: { id: number; score: number; len: number } | null = null;
    for (const a of catalogue) {
      const name = a.name.toLowerCase();
      const score = scoreAmenity(needle, name);
      if (score === 0) continue;
      // Higher score wins; on a tie prefer the shorter (closer) name.
      if (!best || score > best.score || (score === best.score && name.length < best.len)) {
        best = { id: a.amenity_id, score, len: name.length };
      }
    }
    if (best && !ids.includes(best.id)) ids.push(best.id);
  }
  return ids;
};

export function ListingFilterProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [location, setLocationState] = useState<{
    query: string;
    latitude?: number;
    longitude?: number;
  }>({ query: '' });
  const [dates, setDatesState] = useState<{
    checkIn: Date | null;
    checkOut: Date | null;
  }>({ checkIn: null, checkOut: null });
  const [guests, setGuestsState] = useState<GuestCount>(DEFAULT_GUESTS);
  const [sort, setSortState] = useState<SortOption>('recommended');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [amenityCatalogue, setAmenityCatalogue] = useState<
    { amenity_id: number; name: string }[]
  >([]);

  const mountedRef = useRef(true);

  // Load the amenity catalogue once so Facilities labels can be mapped to ids.
  useEffect(() => {
    let active = true;
    api
      .amenities()
      .then((rows) => {
        if (active) setAmenityCatalogue(rows ?? []);
      })
      .catch((err) => console.error('[Context] amenities load failed:', err));
    return () => {
      active = false;
    };
  }, []);

  const fetchResults = useCallback(
    async (pageNum: number = 0, isRefresh: boolean = false) => {
      console.log(
        '[Context] fetchResults called with location.query=',
        JSON.stringify(location.query),
        'pageNum=',
        pageNum,
      );
      if (!mountedRef.current) {
        console.log('[Context] Aborted: not mounted');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const rows = await api.search(
          filters,
          location.query,
          pageNum,
          DEFAULT_PAGE_SIZE,
          {
            startDate: toISODate(dates.checkIn),
            endDate: toISODate(dates.checkOut),
            totalGuests: guests.adults + guests.children,
            amenities: resolveAmenityIds(filters.amenities, amenityCatalogue),
            latitude: location.latitude,
            longitude: location.longitude,
          },
        );
        console.log('[Context] api.search returned rows:', rows?.length);

        if (!mountedRef.current) return;

        const mapped = rows.map(mapListingToProperty).filter((item) => item.id);
        console.log('[Context] mapped properties:', mapped.length);

        if (pageNum === 0 || isRefresh) {
          setProperties(mapped);
        } else {
          setProperties((prev) => [...prev, ...mapped]);
        }

        setHasMore(mapped.length === DEFAULT_PAGE_SIZE);
        if (pageNum === 0 || isRefresh) {
          setTotalCount(mapped.length);
        } else {
          setTotalCount((prev) => prev + mapped.length);
        }
        setPage(pageNum);
      } catch (err) {
        console.error('[Context] Fetch error:', err);
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Search failed');
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [filters, location.query, dates, guests, amenityCatalogue],
  );

  const refresh = useCallback(async () => {
    await fetchResults(0, true);
  }, [fetchResults]);

  const setSort = useCallback((newSort: SortOption) => {
    setSortState(newSort);
    // In a real implementation, sort would trigger a refresh
  }, []);

  const setPriceRange = useCallback((range: [number, number]) => {
    setFilters((prev) => ({ ...prev, priceMin: range[0], priceMax: range[1] }));
  }, []);

  const setRating = useCallback((rating: number | null) => {
    setFilters((prev) => ({ ...prev, guestRating: rating }));
  }, []);

  const toggleAmenity = useCallback((amenity: string) => {
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  }, []);

  const togglePropertyType = useCallback((type: string) => {
    setFilters((prev) => ({
      ...prev,
      propertyTypes: prev.propertyTypes.includes(type)
        ? prev.propertyTypes.filter((t) => t !== type)
        : [...prev.propertyTypes, type],
    }));
  }, []);

  const toggleBedType = useCallback((type: string) => {
    setFilters((prev) => ({
      ...prev,
      bedTypes: prev.bedTypes.includes(type)
        ? prev.bedTypes.filter((t) => t !== type)
        : [...prev.bedTypes, type],
    }));
  }, []);

  const setBooleanFilter = useCallback(
    (key: keyof SearchFilters, value: boolean) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const fetchMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchResults(page + 1);
    }
  }, [hasMore, loading, page, fetchResults]);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const setLocation = useCallback(
    (loc: { query: string; latitude?: number; longitude?: number }) => {
      setLocationState(loc);
    },
    [],
  );

  const setDates = useCallback(
    (newDates: { checkIn: Date | null; checkOut: Date | null }) => {
      setDatesState(newDates);
    },
    [],
  );

  const setGuests = useCallback((newGuests: GuestCount) => {
    setGuestsState(newGuests);
  }, []);

  const initializedRef = useRef(false);
  const prevLocationRef = useRef(location.query);
  const prevFiltersRef = useRef(JSON.stringify(filters));
  const prevDatesRef = useRef(JSON.stringify(dates));
  const prevGuestsRef = useRef(JSON.stringify(guests));

  // Trigger initial fetch and fetch on filter/location/date/guest change
  useEffect(() => {
    const datesKey = JSON.stringify(dates);
    const guestsKey = JSON.stringify(guests);
    const locationChanged = prevLocationRef.current !== location.query;
    const filtersChanged = prevFiltersRef.current !== JSON.stringify(filters);
    const datesChanged = prevDatesRef.current !== datesKey;
    const guestsChanged = prevGuestsRef.current !== guestsKey;

    prevLocationRef.current = location.query;
    prevFiltersRef.current = JSON.stringify(filters);
    prevDatesRef.current = datesKey;
    prevGuestsRef.current = guestsKey;

    // Skip initial empty render
    if (!initializedRef.current && !location.query) {
      initializedRef.current = true;
      return;
    }

    initializedRef.current = true;

    // Reset page and properties when location changes
    if (locationChanged) {
      console.log('[Context] Location changed to:', location.query);
      setPage(0);
      setProperties([]);
      setHasMore(true);
    }

    // Fetch results (always from page 0 for new location/filters/dates/guests)
    if (locationChanged || filtersChanged || datesChanged || guestsChanged) {
      fetchResults(0, true);
    }
  }, [location.query, filters, dates, guests]); // fetchResults intentionally omitted

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Sort is applied client-side over the already-loaded results so changing
  // the sort reorders instantly (the API doesn't sort).
  const sortedProperties = useMemo(() => {
    const list = [...properties];
    switch (sort) {
      case 'price_asc':
        return list.sort((a, b) => a.price - b.price);
      case 'price_desc':
        return list.sort((a, b) => b.price - a.price);
      case 'top_rated':
        return list.sort((a, b) => b.rating - a.rating);
      case 'most_popular':
        return list.sort((a, b) => b.reviewCount - a.reviewCount);
      case 'newest':
        return list.sort((a, b) => Number(b.isNew) - Number(a.isNew));
      case 'best_value':
        return list.sort(
          (a, b) => b.rating / (b.price || 1) - a.rating / (a.price || 1),
        );
      default:
        return list;
    }
  }, [properties, sort]);

  const state: ListingState = {
    properties: sortedProperties,
    loading,
    error,
    filters,
    location,
    dates,
    guests,
    sort,
    pagination: {
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      hasMore,
    },
    counts: {
      total: totalCount,
    },
  };

  const actions: ListingActions = {
    setSort,
    setPriceRange,
    setRating,
    toggleAmenity,
    togglePropertyType,
    toggleBedType,
    setBooleanFilter,
    fetchMore,
    clearFilters,
    setLocation,
    setDates,
    setGuests,
    refresh,
  };

  return (
    <ListingStateContext.Provider value={state}>
      <ListingDispatchContext.Provider value={actions}>
        {children}
      </ListingDispatchContext.Provider>
    </ListingStateContext.Provider>
  );
}

export function useListingState(): ListingState {
  const context = useContext(ListingStateContext);
  if (!context) {
    throw new Error(
      'useListingState must be used within ListingFilterProvider',
    );
  }
  return context;
}

export function useListingActions(): ListingActions {
  const context = useContext(ListingDispatchContext);
  if (!context) {
    throw new Error(
      'useListingActions must be used within ListingFilterProvider',
    );
  }
  return context;
}
