import { useState, useRef, useEffect } from 'react';
import { MapPin, Clock, Navigation, Loader2 } from 'lucide-react';
import { SUGGESTED_DESTINATIONS } from '@/constants/data';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { reverseGeocode } from '@/lib/services/geocoding';

interface DestinationDropdownProps {
  value: string;
  onQueryChange: (value: string) => void;
  onSelect: (value: string) => void;
  onClose: () => void;
}

const RECENT_STORAGE_KEY = 'hostiggo:recent-searches';
const MAX_RECENT = 3;

function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function pushRecentSearch(value: string) {
  try {
    const current = getRecentSearches().filter((v) => v.toLowerCase() !== value.toLowerCase());
    const next = [value, ...current].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export default function DestinationDropdown({
  value,
  onQueryChange,
  onSelect,
  onClose,
}: DestinationDropdownProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRecent(getRecentSearches());
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounce API calls
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.locations(10, query);
        setResults(data || []);
      } catch (e) {
        console.error('Location search error:', e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  const handleSelect = (name: string) => {
    pushRecentSearch(name);
    onSelect(name);
    onClose();
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const result = await reverseGeocode(position.coords.latitude, position.coords.longitude);
          const label = result?.address.city || result?.address.county || result?.displayName;
          if (label) handleSelect(label);
        } finally {
          setLocating(false);
        }
      },
      () => setLocating(false),
      { timeout: 10000 },
    );
  };

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    // Update parent location state, debounced
    onQueryChange(newQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      handleSelect(query);
    }
  };

  return (
    <div className="dropdown-panel animate-fade-in-down w-[340px] max-w-[92vw]">
      {/* Input */}
      <div className="p-3 border-b border-gray-50">
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
          <MapPin className="w-4 h-4 text-figma-navy flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search destinations..."
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => {
                handleQueryChange('');
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="py-2 max-h-[340px] overflow-y-auto scrollbar-hide">
        {/* Current location */}
        <button
          onClick={handleUseCurrentLocation}
          disabled={locating}
          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-figma-navy/5 transition-colors text-left group disabled:opacity-60"
        >
          <div className="w-9 h-9 bg-figma-navy/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-figma-navy/20 transition-colors">
            {locating ? (
              <Loader2 className="w-4 h-4 text-figma-navy animate-spin" />
            ) : (
              <Navigation className="w-4 h-4 text-figma-navy" />
            )}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-gray-800">
              {locating ? 'Finding your location…' : 'Use current location'}
            </p>
            <p className="text-[11px] text-gray-400">Near me stays</p>
          </div>
        </button>

        {/* Recent if no query */}
        {!query.trim() && recent.length > 0 && (
          <>
            <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Recent searches
            </p>
            {recent.map((r) => (
              <button
                key={r}
                onClick={() => handleSelect(r)}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <span className="text-[13px] font-medium text-gray-700">
                  {r}
                </span>
              </button>
            ))}
            <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              Popular destinations
            </p>
          </>
        )}

        {/* Destination list */}
        {query.trim() && loading ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-gray-400 font-medium">Searching...</p>
          </div>
        ) : query.trim() && results.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-gray-400 font-medium">
              No exact match found in database
            </p>
            <p className="text-xs text-gray-300 mt-1">
              You can still search for &quot;{query}&quot;
            </p>
          </div>
        ) : (
          results.map((dest) => {
            const displayName =
              dest.district || dest.lower_division_name || dest.state;
            return (
              <button
                key={dest.location_id}
                onClick={() => handleSelect(displayName)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 hover:bg-figma-navy/5 transition-colors text-left group',
                  value === displayName && 'bg-figma-navy/5',
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-figma-navy/20 transition-colors">
                  <MapPin className="w-5 h-5 text-gray-500 group-hover:text-figma-navy transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-gray-800 truncate">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {dest.state}
                  </p>
                </div>
                {value === displayName && (
                  <div className="w-2 h-2 rounded-full bg-figma-navy flex-shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
