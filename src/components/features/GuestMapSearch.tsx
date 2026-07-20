'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Loader, Navigation, ArrowRight } from 'lucide-react';
import InteractiveMap from '@/components/features/InteractiveMap';
import { autocompleteAddress, geocodeAddress, reverseGeocode } from '@/lib/services/geocoding';
import { useListingActions } from '@/context/ListingFilterContext';
import { cn } from '@/lib/utils';
import type { Property } from '@/types';

interface LocationSuggestion {
  placeId: string;
  displayName: string;
  latitude: number;
  longitude: number;
}

interface GuestMapSearchProps {
  properties: Property[];
  activeId?: string | null;
  onMarkerClick?: (id: string) => void;
  className?: string;
}

export default function GuestMapSearch({
  properties,
  activeId,
  onMarkerClick,
  className = '',
}: GuestMapSearchProps) {
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pointerCoords, setPointerCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [geocodingLabel, setGeocodingLabel] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { setLocation } = useListingActions();

  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }

      setSuggestionsLoading(true);
      try {
        const results = await autocompleteAddress(query);
        setSuggestions(
          results.map((r) => ({
            placeId: r.placeId.toString(),
            displayName: r.displayName,
            latitude: r.latitude,
            longitude: r.longitude,
          })),
        );
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    },
    [],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setSearchInput(newValue);
      setShowSuggestions(true);

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        fetchSuggestions(newValue);
      }, 400);
    },
    [fetchSuggestions],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: LocationSuggestion) => {
      setSearchInput(suggestion.displayName);
      setSelectedLabel(suggestion.displayName);
      setPointerCoords({ lat: suggestion.latitude, lng: suggestion.longitude });
      setShowSuggestions(false);
      setSuggestions([]);
    },
    [],
  );

  const handleMarkerDrag = useCallback(
    async (lat: number, lng: number) => {
      setPointerCoords({ lat, lng });
      setGeocodingLabel(true);
      const address = await reverseGeocode(lat, lng);

      if (address) {
        setSelectedLabel(address.displayName);
      }
    },
    [],
  );

  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPointerCoords({ lat, lng });
        setGeocodingLabel(true);
        const address = await reverseGeocode(lat, lng);

        if (address) {
          setSelectedLabel(address.displayName);
        }
      },
      (err) => {
        console.warn('[GuestMapSearch] Geolocation error:', err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const handleSearchThisArea = useCallback(() => {
    if (!pointerCoords) return;

    setLocation({
      query: selectedLabel,
      latitude: pointerCoords.lat,
      longitude: pointerCoords.lng,
    });

    router.push('/search');
  }, [pointerCoords, selectedLabel, setLocation, router]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`flex h-full gap-4 ${className}`}>
      {/* Search panel */}
      <div className="w-full md:w-80 flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Search input */}
        <div ref={searchContainerRef} className="relative">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search locations..."
                value={searchInput}
                onChange={handleInputChange}
                onFocus={() => setShowSuggestions(true)}
                className="flex-1 bg-transparent text-sm font-medium outline-none"
              />
              {suggestionsLoading && <Loader className="w-4 h-4 text-figma-navy animate-spin" />}
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-4 right-4 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.placeId}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-3 hover:bg-figma-navy/5 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                  >
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.displayName}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="p-4 space-y-2 border-b border-gray-100">
            <button
              onClick={handleCurrentLocation}
              className="w-full flex items-center justify-center gap-2 bg-figma-navy/5 text-figma-navy px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-figma-navy/10 transition-colors"
            >
              <Navigation className="w-4 h-4" />
              Use current location
            </button>

            {pointerCoords && (
              <button
                onClick={handleSearchThisArea}
                disabled={geocodingLabel}
                className="w-full flex items-center justify-center gap-2 bg-figma-navy text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-figma-navy/90 transition-colors disabled:opacity-50"
              >
                <ArrowRight className="w-4 h-4" />
                {geocodingLabel ? 'Searching...' : 'Search this area'}
              </button>
            )}
          </div>

          {/* Selected location display */}
          {selectedLabel && (
            <div className="p-4 text-center border-b border-gray-100">
              <p className="text-sm text-gray-600">
                Selected location:
              </p>
              <p className="font-semibold text-gray-900 mt-1">{selectedLabel}</p>
            </div>
          )}
        </div>

        {/* Properties list */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 text-center text-sm text-gray-500">
            {properties.filter((p) => p.coordinates).length} properties near location
          </div>
        </div>
      </div>

      {/* Map panel */}
      <div className="hidden md:flex flex-1 rounded-2xl overflow-hidden shadow-lg">
        <InteractiveMap
          properties={properties}
          activeId={activeId}
          onMarkerClick={onMarkerClick}
          pointer={pointerCoords}
          onPointerMoved={handleMarkerDrag}
          reverseGeocodeEnabled={true}
          className="w-full"
        />
      </div>
    </div>
  );
}
