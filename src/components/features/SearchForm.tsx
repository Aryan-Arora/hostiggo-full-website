import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Calendar, Users, ChevronDown, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import DestinationDropdown from '@/components/features/DestinationDropdown';
import DateRangePicker from '@/components/features/DateRangePicker';
import GuestDropdown from '@/components/features/GuestDropdown';
import {
  useListingState,
  useListingActions,
} from '@/context/ListingFilterContext';
import { cn } from '@/lib/utils';

type Panel = 'destination' | 'date' | 'guests' | null;

function fmtDate(d: Date | null) {
  if (!d) return null;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Compact search bar used on the SearchResultsPage */
export function CompactSearchBar() {
  const { location, dates, guests } = useListingState();
  const { setLocation, setDates, setGuests } = useListingActions();
  const [activePanel, setActivePanel] = useState<Panel>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setActivePanel(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (p: Panel) => setActivePanel((cur) => (cur === p ? null : p));

  const handleSearch = () => {
    if (!location.query.trim()) {
      toast.error('Please enter a destination');
      return;
    }
    router.push(`/search?destination=${encodeURIComponent(location.query)}`);
    setActivePanel(null);
  };

  return (
    <div ref={wrapRef} className="flex items-center gap-3 w-full">
      {/* Destination Pill */}
      <div className="relative flex-[1.2] min-w-0">
        <button
          onClick={() => toggle('destination')}
          className={cn(
            'w-full h-[52px] flex items-center gap-3 px-5 rounded-full bg-white transition-all text-left border-2',
            activePanel === 'destination'
              ? 'border-blue-400'
              : 'border-transparent',
          )}
        >
          <Search
            className="w-5 h-5 text-gray-400 flex-shrink-0"
            strokeWidth={2.5}
          />
          <span
            className={cn(
              'text-[14px] font-medium truncate',
              location.query ? 'text-gray-900' : 'text-gray-400',
            )}
          >
            {location.query || 'New Delhi'}
          </span>
          {location.query && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear destination"
              className="ml-auto p-1 hover:bg-gray-100 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                setLocation({ query: '' });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  setLocation({ query: '' });
                }
              }}
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </span>
          )}
        </button>
        {activePanel === 'destination' && (
          <div className="absolute top-[calc(100%+12px)] left-0 w-full min-w-[320px] z-50">
            <DestinationDropdown
              value={location.query}
              onQueryChange={(v) => setLocation({ query: v })}
              onSelect={(v) => {
                setLocation({ query: v });
                setActivePanel(null);
              }}
              onClose={() => setActivePanel(null)}
            />
          </div>
        )}
      </div>

      {/* Date Pill */}
      <div className="relative flex-[1.5] min-w-0">
        <button
          onClick={() => toggle('date')}
          className={cn(
            'w-full h-[52px] flex items-center gap-4 px-5 rounded-full bg-white transition-all text-left border-2',
            activePanel === 'date' ? 'border-blue-400' : 'border-transparent',
          )}
        >
          <Calendar
            className="w-5 h-5 text-gray-600 flex-shrink-0"
            strokeWidth={1.5}
          />
          <div className="flex items-center gap-6 min-w-0 flex-1">
            <div className="min-w-0">
              {dates.checkIn ? (
                <>
                  <p className="text-[13px] font-bold text-gray-900 leading-none mb-1">
                    {fmtDate(dates.checkIn)}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {dates.checkIn.toLocaleDateString('en-US', {
                      weekday: 'long',
                    })}
                  </p>
                </>
              ) : (
                <p className="text-[13px] text-gray-400">Add dates</p>
              )}
            </div>

            <svg
              width="14"
              height="12"
              viewBox="0 0 14 12"
              fill="none"
              className="text-gray-300 flex-shrink-0"
            >
              <path
                d="M1 6H13M13 6L8.5 1.5M13 6L8.5 10.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <div className="min-w-0">
              {dates.checkOut ? (
                <>
                  <p className="text-[13px] font-bold text-gray-900 leading-none mb-1">
                    {fmtDate(dates.checkOut)}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {dates.checkOut.toLocaleDateString('en-US', {
                      weekday: 'long',
                    })}
                  </p>
                </>
              ) : (
                <p className="text-[13px] text-gray-400">Add dates</p>
              )}
            </div>
          </div>
        </button>
        {activePanel === 'date' && (
          <div className="absolute top-[calc(100%+12px)] left-1/2 -translate-x-1/2 z-50">
            <DateRangePicker
              checkIn={dates.checkIn}
              checkOut={dates.checkOut}
              onChange={(checkIn, checkOut) => setDates({ checkIn, checkOut })}
              onClose={() => setActivePanel(null)}
            />
          </div>
        )}
      </div>

      {/* Guests Pill */}
      <div className="relative flex-[1.3] min-w-0">
        <button
          onClick={() => toggle('guests')}
          className={cn(
            'w-full h-[52px] flex items-center gap-3 px-5 rounded-full bg-white transition-all text-left border-2',
            activePanel === 'guests'
              ? 'border-blue-400'
              : 'border-transparent',
          )}
        >
          <Users
            className="w-5 h-5 text-gray-500 flex-shrink-0"
            strokeWidth={1.5}
          />
          <div className="flex-1 truncate">
            <p className="text-[13px] font-bold text-gray-800">
              {guests.adults} Adults • {guests.rooms} Room
            </p>
            <p className="text-[11px] text-gray-400">
              {guests.children} Children
            </p>
          </div>
          <ChevronDown
            className={cn(
              'w-5 h-5 text-gray-400 transition-transform',
              activePanel === 'guests' && 'rotate-180',
            )}
          />
        </button>
        {activePanel === 'guests' && (
          <div className="absolute top-[calc(100%+12px)] right-0 z-50">
            <GuestDropdown
              guests={guests}
              onChange={setGuests}
              onClose={() => setActivePanel(null)}
            />
          </div>
        )}
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        className="h-[52px] px-8 bg-primary-gradient border-2 border-white/20 text-white font-bold text-[15px] rounded-full transition-all shadow-md active:scale-95 flex-shrink-0"
      >
        Search
      </button>
    </div>
  );
}

/** Full search form used on home page hero */
export default function SearchForm() {
  const { location, dates, guests } = useListingState();
  const { setLocation, setDates, setGuests } = useListingActions();
  const [activePanel, setActivePanel] = useState<Panel>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setActivePanel(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (p: Panel) => setActivePanel((cur) => (cur === p ? null : p));

  const guestSummary = () => {
    const g = guests;
    const parts = [`${g.adults} Adult${g.adults !== 1 ? 's' : ''}`];
    if (g.children > 0)
      parts.push(`${g.children} Child${g.children !== 1 ? 'ren' : ''}`);
    parts.push(`${g.rooms} Room${g.rooms !== 1 ? 's' : ''}`);
    return parts.join(', ');
  };

  const handleSearch = () => {
    if (!location.query.trim()) {
      toast.error('Please enter a destination');
      return;
    }
    router.push(`/search?destination=${encodeURIComponent(location.query)}`);
    setActivePanel(null);
  };

  return (
    <div
      ref={wrapRef}
      className="w-full flex-1 max-w-lg mx-auto lg:ml-auto lg:mr-0"
    >
      <div className="flex flex-col gap-3.5">
        {/* Destination */}
        <div className="relative">
          <button
            onClick={() => toggle('destination')}
            className={cn(
              'w-full flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all text-left bg-white',
              activePanel === 'destination'
                ? 'border-blue-500 shadow-md ring-4 ring-blue-500/10'
                : 'border-gray-200 hover:border-gray-300 shadow-sm hover:shadow',
            )}
          >
            <Search
              className="w-5 h-5 text-gray-400 flex-shrink-0"
              strokeWidth={2}
            />
            <div className="min-w-0 flex-1">
              {location.query ? (
                <p className="text-[14px] font-medium text-gray-900 truncate">
                  {location.query}
                </p>
              ) : (
                <p className="text-[14px] font-medium text-gray-400 truncate">
                  Search destination or homestay
                </p>
              )}
            </div>
          </button>
          {activePanel === 'destination' && (
            <div className="absolute top-[calc(100%+8px)] left-0 w-full z-50">
              <DestinationDropdown
                value={location.query}
                onQueryChange={(v) => setLocation({ query: v })}
                onSelect={(v) => {
                  setLocation({ query: v });
                  setActivePanel('date');
                }}
                onClose={() => setActivePanel(null)}
              />
            </div>
          )}
        </div>

        {/* Dates Row */}
        <div className="flex gap-3.5 relative">
          {/* Check In */}
          <div className="relative flex-1">
            <button
              onClick={() => toggle('date')}
              className={cn(
                'w-full flex items-start gap-3 px-4 py-3.5 rounded-2xl border transition-all text-left bg-white',
                activePanel === 'date'
                  ? 'border-blue-500 shadow-md ring-4 ring-blue-500/10'
                  : 'border-gray-200 hover:border-gray-300 shadow-sm hover:shadow',
              )}
            >
              <Calendar
                className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5"
                strokeWidth={1.5}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-gray-900 mb-1">
                  Check In
                </p>
                {dates.checkIn ? (
                  <>
                    <p className="text-[11px] text-gray-500">
                      {dates.checkIn.toLocaleDateString('en-US', {
                        weekday: 'long',
                      })}
                    </p>
                    <p className="text-[13px] font-medium text-gray-900">
                      {fmtDate(dates.checkIn)}
                    </p>
                  </>
                ) : (
                  <p className="text-[13px] text-gray-400 mt-1">Add date</p>
                )}
              </div>
            </button>
          </div>

          {/* Check Out */}
          <div className="relative flex-1">
            <button
              onClick={() => toggle('date')}
              className={cn(
                'w-full flex items-start gap-3 px-4 py-3.5 rounded-2xl border transition-all text-left bg-white',
                activePanel === 'date'
                  ? 'border-blue-500 shadow-md ring-4 ring-blue-500/10'
                  : 'border-gray-200 hover:border-gray-300 shadow-sm hover:shadow',
              )}
            >
              <Calendar
                className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5"
                strokeWidth={1.5}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-gray-900 mb-1">
                  Check Out
                </p>
                {dates.checkOut ? (
                  <>
                    <p className="text-[11px] text-gray-500">
                      {dates.checkOut.toLocaleDateString('en-US', {
                        weekday: 'long',
                      })}
                    </p>
                    <p className="text-[13px] font-medium text-gray-900">
                      {fmtDate(dates.checkOut)}
                    </p>
                  </>
                ) : (
                  <p className="text-[13px] text-gray-400 mt-1">Add date</p>
                )}
              </div>
            </button>
          </div>

          {/* Shared DatePicker Popover */}
          {activePanel === 'date' && (
            <div className="absolute top-[calc(100%+8px)] left-0 w-full flex justify-center z-50">
              <DateRangePicker
                checkIn={dates.checkIn}
                checkOut={dates.checkOut}
                onChange={(checkIn, checkOut) =>
                  setDates({ checkIn, checkOut })
                }
                onClose={() => setActivePanel(null)}
              />
            </div>
          )}
        </div>

        {/* Guests */}
        <div className="relative">
          <button
            onClick={() => toggle('guests')}
            className={cn(
              'w-full flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all text-left bg-white',
              activePanel === 'guests'
                ? 'border-blue-500 shadow-md ring-4 ring-blue-500/10'
                : 'border-gray-200 hover:border-gray-300 shadow-sm hover:shadow',
            )}
          >
            <Users
              className="w-5 h-5 text-gray-600 flex-shrink-0"
              strokeWidth={1.5}
            />
            <div className="min-w-0 flex-1 flex items-center gap-1.5">
              <span className="text-[14px] font-medium text-gray-800">
                {guests.adults} Adults
              </span>
              <span className="text-gray-300 text-xs">•</span>
              <span className="text-[14px] font-medium text-gray-800">
                {guests.rooms} Room
              </span>
              <span className="text-gray-300 text-xs">•</span>
              <span className="text-[14px] font-medium text-gray-500">
                {guests.children} Children
              </span>
            </div>
            <ChevronDown
              className={cn(
                'w-5 h-5 text-gray-800 flex-shrink-0 transition-transform duration-200',
                activePanel === 'guests' && 'rotate-180',
              )}
              strokeWidth={2}
            />
          </button>
          {activePanel === 'guests' && (
            <div className="absolute top-[calc(100%+8px)] left-0 w-full z-50">
              <GuestDropdown
                guests={guests}
                onChange={setGuests}
                onClose={() => setActivePanel(null)}
              />
            </div>
          )}
        </div>

        {/* Search Button */}
        <div className="mt-2 flex justify-center">
          <button
            onClick={handleSearch}
            className="w-full max-w-[240px] flex items-center justify-center bg-primary-gradient text-white font-bold text-[15px] rounded-full px-6 py-3.5 transition-all shadow-md hover:opacity-90 active:scale-95"
          >
            Search
          </button>
        </div>

        {/* Search on Map Button */}
        <button
          onClick={() => {
            if (location.query.trim().length > 0) {
              toast.error('You can either use the map or fill in the location yourself, not both.');
              return;
            }
            router.push('/search?view=map');
          }}
          className={cn(
            "mt-1 w-full flex items-center gap-4 bg-white rounded-2xl p-4 border transition-all text-left",
            location.query.trim().length > 0
              ? "opacity-50 cursor-not-allowed border-gray-200"
              : "border-gray-200 hover:border-gray-300 shadow-sm hover:shadow"
          )}
        >
          <div className="w-12 h-12 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm flex-shrink-0">
            <MapPin className="w-6 h-6 text-blue-500" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-gray-900">Search on Map</h3>
            <p className="text-[12px] text-gray-500">For Accurate Location</p>
          </div>
        </button>
      </div>
    </div>
  );
}
