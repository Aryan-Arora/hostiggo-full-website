import { useState, useRef, useEffect } from 'react';
import { MapPin, Clock, Navigation } from 'lucide-react';
import { SUGGESTED_DESTINATIONS } from '@/constants/data';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface DestinationDropdownProps {
  value: string;
  onQueryChange: (value: string) => void;
  onSelect: (value: string) => void;
  onClose: () => void;
}

const RECENT = ['New Delhi', 'Manali', 'Shimla'];

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

  return (
    <div className="dropdown-panel animate-fade-in-down w-[340px] max-w-[92vw]">
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

      <div className="py-2 max-h-[340px] overflow-y-auto scrollbar-hide">
        {/* Current location */}
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

        {/* Recent if no query */}
        {!query.trim() && (
          <>
            <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Recent searches
            </p>
            {RECENT.map((r) => (
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
    </div>
  );
}
