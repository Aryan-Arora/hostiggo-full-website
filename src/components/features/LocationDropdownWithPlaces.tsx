'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, MapPin, Loader } from 'lucide-react';
import { autocompleteAddress, geocodeAddress, reverseGeocode } from '@/lib/services/geocoding';
import { useListingActions } from '@/context/ListingFilterContext';
import { cn } from '@/lib/utils';

interface LocationSuggestion {
  placeId: string;
  displayName: string;
  latitude: number;
  longitude: number;
}

interface LocationDropdownProps {
  value: string;
  onChange?: (location: LocationSuggestion) => void;
  onClose?: () => void;
  placeholder?: string;
}

export function LocationDropdown({
  value,
  onChange,
  onClose,
  placeholder = 'Search destination...',
}: LocationDropdownProps) {
  const [input, setInput] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setLocation } = useListingActions();

  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
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
      } catch (error) {
        console.error('[LocationDropdown] Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInput(newValue);
      setIsOpen(true);

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        fetchSuggestions(newValue);
      }, 400);
    },
    [fetchSuggestions],
  );

  const handleSelectLocation = useCallback(
    async (suggestion: LocationSuggestion) => {
      setInput(suggestion.displayName);

      // Geocode the selected location to get coordinates
      const coords = await geocodeAddress(suggestion.displayName);
      if (coords) {
        const address = await reverseGeocode(coords.latitude, coords.longitude);
        setLocation({
          query: address?.displayName || suggestion.displayName,
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
      }

      onChange?.(suggestion);
      setIsOpen(false);
      onClose?.();
    },
    [onChange, onClose, setLocation],
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-location-dropdown]')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div data-location-dropdown className="relative w-full">
      <div className="relative">
        <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl">
          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm font-medium outline-none"
          />
          {loading && <Loader className="w-4 h-4 text-figma-navy animate-spin" />}
        </div>

        {isOpen && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.placeId}
                onClick={() => handleSelectLocation(suggestion)}
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
    </div>
  );
}
