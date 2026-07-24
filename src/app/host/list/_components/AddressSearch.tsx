'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';
import { autocompleteAddress, geocodeAddress, formatAddress } from '@/lib/services/geocoding';

interface AddressSearchProps {
  value: string;
  onChange?: (address: string) => void;
  onSelect?: (latitude: number, longitude: number, address: string) => void;
  placeholder?: string;
}

interface Suggestion {
  placeId: string;
  displayName: string;
  latitude: number;
  longitude: number;
}

export default function AddressSearch({
  value,
  onChange,
  onSelect,
  placeholder = 'Enter your property address',
}: AddressSearchProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced autocomplete search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const results = await autocompleteAddress(query);
      setSuggestions(results);
      setLoading(false);
      setShowSuggestions(true);
    }, 400);
  }, [query]);

  const handleSelectSuggestion = async (suggestion: Suggestion) => {
    setQuery(suggestion.displayName);
    setSuggestions([]);
    setShowSuggestions(false);
    onChange?.(suggestion.displayName);
    onSelect?.(suggestion.latitude, suggestion.longitude, suggestion.displayName);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    onChange?.('');
  };

  return (
    <div className="relative w-full">
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-card transition-all hover:border-figma-navy/40">
        <label
          htmlFor="address-search"
          className="text-xs font-semibold text-gray-500 block mb-2 px-1 uppercase tracking-wider"
        >
          Search address
        </label>
        <div className="relative">
          <MapPin className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            id="address-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-figma-navy focus:border-transparent transition-all outline-none"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
              type="button"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.placeId}
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              type="button"
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">
                    {suggestion.displayName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {suggestion.latitude.toFixed(4)}, {suggestion.longitude.toFixed(4)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Loading state */}
      {loading && query.length >= 3 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 px-4 py-3 flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-figma-accent animate-spin" />
          <span className="text-sm text-gray-500">Searching addresses...</span>
        </div>
      )}
    </div>
  );
}
