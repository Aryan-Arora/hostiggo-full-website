import {
  useListingActions,
  useListingState,
} from '@/context/ListingFilterContext';
import { cn } from '@/lib/utils';
import type { SearchFilters } from '@/types';
import { Star } from 'lucide-react';
import MapPreview from '@/components/features/MapPreview';

interface FiltersSidebarProps {
  onReset?: () => void;
  city?: string;
  count?: number;
  filters?: SearchFilters;
}

function Section({
  title,
  children,
  showClear = false,
  onClear,
  noBorder = false,
}: {
  title: string;
  children: React.ReactNode;
  showClear?: boolean;
  onClear?: () => void;
  noBorder?: boolean;
}) {
  return (
    <div
      className={cn(
        'pb-6 mb-6',
        !noBorder && 'border-b border-dashed border-gray-200',
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[17px] font-bold text-[#1A1A1A]">{title}</h3>
        {showClear && (
          <button
            onClick={onClear}
            className="text-[13px] font-semibold text-[#0396EF] hover:underline"
          >
            Clear all
          </button>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

function CheckChip({
  label,
  checked,
  onChange,
  className,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  className?: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'px-3 py-2 rounded-[10px] text-[13px] font-medium border transition-all h-auto min-h-[38px] text-center flex items-center justify-center flex-1 min-w-[calc(50%-4px)]',
        checked
          ? 'bg-[#0396EF]/[0.08] text-[#0396EF] border-[#0396EF]'
          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300',
        className,
      )}
    >
      <span className="leading-tight">{label}</span>
    </button>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center gap-2.5 cursor-pointer py-1.5 group text-left"
    >
      <div
        className={cn(
          'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
          checked
            ? 'bg-[#0396EF] border-[#0396EF]'
            : 'border-gray-300 group-hover:border-[#0396EF]',
        )}
      >
        {checked && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path
              d="M1 3L3 5L7 1"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <span
        className={cn(
          'text-[13px] transition-colors',
          checked
            ? 'text-[#1A1A1A] font-semibold'
            : 'text-gray-600 group-hover:text-[#1A1A1A]',
        )}
      >
        {label}
      </span>
    </button>
  );
}

const PROPERTY_TYPES = ['Homestay', 'Villa', 'Cottage', 'Apartment', 'Resort'];
const AMENITY_LIST = [
  'WiFi',
  'Kitchen',
  'Parking',
  'Pool',
  'Mountain view',
  'Balcony',
];
const BED_TYPES = ['Single bed', 'Double bed', 'Queen bed', 'King bed'];

function fmtPrice(v: number, isMax: boolean, MAX: number) {
  if (isMax && v >= MAX) return '₹1L+';
  if (v >= 100000) return `₹${(v / 100000).toFixed(v % 100000 === 0 ? 0 : 1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
  return `₹${v}`;
}

function PriceSlider({
  min,
  max,
  onPriceChange,
}: {
  min: number;
  max: number;
  onPriceChange: (min: number, max: number) => void;
}) {
  const MIN = 0;
  const MAX = 100000;
  const pct1 = Math.min(100, Math.max(0, (min / MAX) * 100));
  const pct2 = Math.min(100, Math.max(0, (max / MAX) * 100));

  const ticks = [
    { v: 0, label: '₹0' },
    { v: 25000, label: '₹25k' },
    { v: 50000, label: '₹50k' },
    { v: 75000, label: '₹75k' },
    { v: 100000, label: '₹1L+' },
  ];

  return (
    <div className="mt-2 overflow-x-hidden">
      {/* Selected range label */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-center">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Min</p>
          <p className="text-[14px] font-bold text-[#004772]">{fmtPrice(min, false, MAX)}</p>
        </div>
        <div className="mx-3 h-px w-4 bg-gray-300" />
        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-center">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Max</p>
          <p className="text-[14px] font-bold text-[#004772]">{fmtPrice(max, true, MAX)}</p>
        </div>
      </div>

      {/* Dual range track — px-3 gives thumb room at both edges */}
      <div className="relative h-10 flex items-center mb-5 px-3 w-full">
        {/* Background track — inset to match padding */}
        <div className="absolute left-3 right-3 h-[5px] bg-gray-200 rounded-full" />
        {/* Active range fill */}
        <div
          className="absolute h-[5px] bg-[#004772] rounded-full"
          style={{
            left: `calc(${pct1}% * (100% - 24px) / 100% + 12px)`,
            right: `calc((100% - ${pct2}%) * (100% - 24px) / 100% + 12px)`,
          }}
        />
        {/* Min thumb indicator */}
        <div
          className="absolute w-5 h-5 bg-white rounded-full shadow-md border-2 border-[#004772] pointer-events-none z-30"
          style={{ left: `calc(${pct1}% * (100% - 24px) / 100% + 2px)` }}
        />
        {/* Max thumb indicator */}
        <div
          className="absolute w-5 h-5 bg-white rounded-full shadow-md border-2 border-[#004772] pointer-events-none z-30"
          style={{ left: `calc(${pct2}% * (100% - 24px) / 100% + 2px)` }}
        />
        {/* Min range input */}
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={1000}
          value={min}
          onChange={(e) => {
            const v = +e.target.value;
            if (v < max) onPriceChange(v, max);
          }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer z-40 pointer-events-auto"
          style={{ height: '100%' }}
        />
        {/* Max range input */}
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={1000}
          value={max}
          onChange={(e) => {
            const v = +e.target.value;
            if (v > min) onPriceChange(min, v);
          }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer z-50 pointer-events-auto"
          style={{ height: '100%' }}
        />
      </div>

      {/* Tick labels */}
      <div className="flex justify-between px-3">
        {ticks.map((tick) => (
          <div key={tick.v} className="flex flex-col items-center">
            <div className="w-px h-2 bg-gray-200 mb-1" />
            <span className="text-[10px] font-medium text-gray-400">{tick.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FiltersSidebar({
  onReset,
  city = 'New Delhi',
  count = 0,
}: FiltersSidebarProps) {
  const { filters } = useListingState();
  const {
    setPriceRange,
    setRating,
    setBooleanFilter,
    toggleAmenity,
    toggleBedType,
    togglePropertyType,
    clearFilters,
  } = useListingActions();

  const handleReset = () => {
    clearFilters();
    if (onReset) onReset();
  };

  return (
    <aside className="w-[280px] lg:w-[320px] xl:w-[360px] flex-shrink-0 max-w-full">
      <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_15px_rgba(0,0,0,0.06)] border border-gray-100 mb-6 overflow-hidden">
        <div className="mb-6">
          <MapPreview city={city} count={count} />
        </div>

        <Section title="Price Range" noBorder>
          <PriceSlider
            min={filters.priceMin}
            max={filters.priceMax}
            onPriceChange={(min, max) => setPriceRange([min, max])}
          />
        </Section>
      </div>

      <div className="bg-white rounded-[20px] p-6 sticky top-[132px] z-30 shadow-[0_2px_15px_rgba(0,0,0,0.06)] border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[17px] font-bold text-gray-800">Filters</h2>
          <button
            onClick={handleReset}
            className="text-[13px] font-semibold text-[#0396EF] hover:underline"
          >
            Clear all
          </button>
        </div>

        <Section title="Popular Filters">
          <div className="flex flex-wrap gap-2 mt-1">
            {[
              { label: 'Free cancellation', key: 'hasFreeCancellation' },
              { label: 'Free breakfast', key: 'hasBreakfast' },
              { label: 'Private room', key: 'hasPrivateRoom' },
              { label: 'Shared room', key: 'hasSharedRoom' },
              { label: 'Double bed', key: 'hasDoubleBed' },
              { label: 'Couple friendly', key: 'isCoupleFriendly' },
              { label: 'Free wifi', key: 'hasWifi' },
              { label: 'Family friendly', key: 'isFamilyFriendly' },
            ].map(({ label, key }) => (
              <CheckChip
                key={label}
                label={label}
                checked={Boolean(filters[key as keyof SearchFilters])}
                onChange={(v) => setBooleanFilter(key as any, v)}
              />
            ))}
          </div>
        </Section>

        <Section title="Guest ratings">
          <div className="mt-1 space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setRating(filters.guestRating === 3 ? 0 : 3)}
                className={cn(
                  'px-3 py-2 rounded-[10px] text-[13px] font-medium border transition-all min-h-[38px] flex flex-1 items-center justify-center gap-1.5 min-w-[100px]',
                  filters.guestRating === 3
                    ? 'bg-[#0396EF]/[0.08] text-[#0396EF] border-[#0396EF]'
                    : 'bg-white text-gray-500 border-gray-200',
                )}
              >
                3{' '}
                <Star
                  className={cn(
                    'w-3.5 h-3.5',
                    filters.guestRating === 3
                      ? 'fill-[#0396EF] text-[#0396EF]'
                      : 'fill-amber-400 text-amber-400',
                  )}
                />{' '}
                or above
              </button>
              <button
                onClick={() => setRating(filters.guestRating === 4 ? 0 : 4)}
                className={cn(
                  'px-3 py-2 rounded-[10px] text-[13px] font-medium border transition-all min-h-[38px] w-12 flex items-center justify-center gap-1',
                  filters.guestRating === 4
                    ? 'bg-[#0396EF]/[0.08] text-[#0396EF] border-[#0396EF]'
                    : 'bg-white text-gray-500 border-gray-200',
                )}
              >
                4 <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              </button>
              <button
                onClick={() => setRating(filters.guestRating === 5 ? 0 : 5)}
                className={cn(
                  'px-3 py-2 rounded-[10px] text-[13px] font-medium border transition-all min-h-[38px] w-12 flex items-center justify-center gap-1',
                  filters.guestRating === 5
                    ? 'bg-[#0396EF]/[0.08] text-[#0396EF] border-[#0396EF]'
                    : 'bg-white text-gray-500 border-gray-200',
                )}
              >
                5 <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              </button>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 rounded-[10px] text-[12px] font-medium border border-gray-200 bg-white text-gray-500 min-h-[38px]">
                Lowest to highest
              </button>
              <button className="flex-1 px-3 py-2 rounded-[10px] text-[12px] font-medium border border-gray-200 bg-white text-gray-500 min-h-[38px]">
                Highest to lowest
              </button>
            </div>
          </div>
        </Section>

        <Section title="Property Type">
          <div className="flex flex-wrap gap-2">
            {PROPERTY_TYPES.map((pt) => (
              <CheckChip
                key={pt}
                label={pt}
                checked={filters.propertyTypes.includes(pt)}
                onChange={() => togglePropertyType(pt)}
              />
            ))}
          </div>
        </Section>

        <Section title="Facilities">
          <div className="space-y-0.5">
            {AMENITY_LIST.map((am) => (
              <CheckRow
                key={am}
                label={am}
                checked={filters.amenities.includes(am)}
                onChange={() => toggleAmenity(am)}
              />
            ))}
          </div>
        </Section>

        <Section title="Bed Type" noBorder>
          <div className="space-y-0.5">
            {BED_TYPES.map((bt) => (
              <CheckRow
                key={bt}
                label={bt}
                checked={filters.bedTypes.includes(bt)}
                onChange={() => toggleBedType(bt)}
              />
            ))}
          </div>
        </Section>
      </div>
    </aside>
  );
}
