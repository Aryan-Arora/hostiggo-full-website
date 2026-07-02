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

function PriceSlider({
  min,
  max,
  onPriceChange,
}: {
  min: number;
  max: number;
  onPriceChange: (min: number, max: number) => void;
}) {
  const MIN = 0,
    MAX = 15000;
  const pct1 = (min / MAX) * 100;
  const pct2 = (max / MAX) * 100;

  return (
    <div className="mt-2 overflow-x-hidden">
      <p className="text-[15px] font-semibold text-gray-700 mb-6">
        Min - Max :{' '}
        <span className="font-bold text-[#1A1A1A]">
          ₹ {Math.round(min).toLocaleString('en-IN')} - ₹{' '}
          {max === MAX ? Math.round(MAX).toLocaleString('en-IN') + '+' : Math.round(max).toLocaleString('en-IN')}
        </span>
      </p>

      <div className="relative h-10 flex items-center mb-8 px-1 w-full">
        <div className="absolute w-full h-2 bg-gray-100 rounded-full" />
        <div
          className="absolute h-2 bg-[#004772] rounded-full"
          style={{ left: `${pct1}%`, right: `${100 - pct2}%` }}
        />

        <div
          className="absolute w-6 h-6 bg-[#004772] rounded-full shadow-lg border-2 border-white pointer-events-none z-30"
          style={{ left: `calc(${pct1}% - 12px)` }}
        />
        <div
          className="absolute w-6 h-6 bg-[#004772] rounded-full shadow-lg border-2 border-white pointer-events-none z-30"
          style={{ left: `calc(${pct2}% - 12px)` }}
        />

        <input
          type="range"
          min={MIN}
          max={MAX}
          step={100}
          value={min}
          onChange={(e) => {
            const v = +e.target.value;
            if (v < max) onPriceChange(v, max);
          }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer z-40 pointer-events-auto"
          style={{ height: '100%' }}
        />
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={100}
          value={max}
          onChange={(e) => {
            const v = +e.target.value;
            if (v > min) onPriceChange(min, v);
          }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer z-50 pointer-events-auto"
          style={{ height: '100%' }}
        />
      </div>

      <div className="flex justify-between px-0.5">
        {[
          { v: 0, label: '₹0' },
          { v: 1000, label: '₹1000' },
          { v: 4000, label: '₹4000' },
          { v: 10000, label: '₹10,000' },
          { v: 15000, label: '15k+' },
        ].map((tick) => (
          <div key={tick.v} className="flex flex-col items-center">
            <div className="w-0.5 h-1.5 bg-gray-200 mb-1" />
            <span className="text-[11px] font-medium text-gray-400">
              {tick.label}
            </span>
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
