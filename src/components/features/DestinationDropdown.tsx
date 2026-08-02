import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation } from 'lucide-react';
import { SUGGESTED_DESTINATIONS, findCityGuide } from '@/constants/data';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface DestinationDropdownProps {
  value: string;
  onQueryChange: (value: string) => void;
  onSelect: (value: string) => void;
  onClose: () => void;
}

const FALLBACK_IMG = '/placeholder.svg';

export default function DestinationDropdown({
  value,
  onQueryChange,
  onSelect,
  onClose,
}: DestinationDropdownProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

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
    onSelect(name);
    onClose();
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

  // Navigate straight to the results for a city (optionally focused on one of
  // its areas). Stays are stored at city level, so `destination` is always the
  // city; `area` is passed through only as display context for the results
  // header.
  const goToSearch = (city: string, area?: string) => {
    onSelect(city);
    onClose();
    const params = new URLSearchParams({ destination: city });
    if (area) params.set('area', area);
    router.push(`/search?${params.toString()}`);
  };

  const cityGuide = findCityGuide(query);

  return (
    <div
      className="dropdown-panel !relative shrink-0 animate-fade-in-down"
      style={{ width: 'min(560px, 92vw)' }}
    >
      {/* Input */}
      <div className="p-3 border-b border-gray-50">
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
          <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
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

      <div className="max-h-[480px] overflow-y-auto scrollbar-hide">
        {query.trim() && cityGuide ? (
          /* Matched city guide: city header + popular areas */
          <div className="py-2">
            <button
              onClick={() => goToSearch(cityGuide.city)}
              className="w-full flex items-center gap-3.5 px-4 py-3 hover:bg-blue-50 transition-colors text-left group"
            >
              <img
                src={cityGuide.imageUrl}
                alt={cityGuide.city}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
                className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 bg-gray-100"
              />
              <div className="min-w-0">
                <p className="text-[16px] font-bold text-gray-900 leading-tight">
                  {cityGuide.city}
                </p>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  ({cityGuide.stayCount.toLocaleString('en-IN')} stays)
                </p>
              </div>
            </button>

            <div className="h-px bg-gray-100 mx-4 my-1.5" />

            {cityGuide.areas.map((area) => (
              <button
                key={area.name}
                onClick={() => goToSearch(cityGuide.city, area.name)}
                className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-blue-100 transition-colors">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-gray-900 leading-tight">
                    {area.name}
                  </p>
                  <p className="text-[12px] text-gray-500 mt-0.5">
                    {area.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : !query.trim() ? (
          /* Empty state: suggested destinations grid */
          <div className="px-4 pt-3 pb-4">
            <p className="text-[15px] font-bold text-gray-900 mb-4">
              Suggested destinations
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3.5">
              {SUGGESTED_DESTINATIONS.map((dest) => (
                <button
                  key={dest.id}
                  onClick={() => handleSelect(dest.name)}
                  className="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-blue-50 transition-colors text-left group"
                >
                  <img
                    src={dest.imageUrl}
                    alt={dest.name}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
                    className="w-12 h-12 rounded-2xl object-cover flex-shrink-0 bg-gray-100"
                  />
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-gray-900 leading-tight truncate">
                      {dest.name}
                    </p>
                    {dest.state && dest.state.toLowerCase() !== dest.name.toLowerCase() && (
                      <p className="text-[12px] text-gray-500 leading-tight truncate">
                        {dest.state}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      ({dest.stayCount.toLocaleString('en-IN')} stays)
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Typed query with no matching city guide: live location results */
          <div className="py-2">
            <button
              onClick={() => handleSelect('Current location')}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left group"
            >
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                <Navigation className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-800">
                  Use current location
                </p>
                <p className="text-[11px] text-gray-400">Near me stays</p>
              </div>
            </button>

            {loading ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-gray-400 font-medium">Searching...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-gray-400 font-medium">
                  No exact match found in database
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  You can still search for "{query}"
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
                      'w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left group',
                      value === displayName && 'bg-blue-50',
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                      <MapPin className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
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
                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
