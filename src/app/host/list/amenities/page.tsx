'use client';

import { useEffect, useState } from 'react';
import {
  Wifi,
  UtensilsCrossed,
  Snowflake,
  Thermometer,
  Tv,
  WashingMachine,
  Car,
  PawPrint,
  Waves,
  Bath,
  DoorOpen,
  Sun,
  Trees,
  Flame,
  Dumbbell,
  ShieldAlert,
  FireExtinguisher,
  BriefcaseMedical,
  Siren,
  LayoutGrid,
  Star,
  ShieldCheck,
  MapPin,
  Lightbulb,
  Check,
  type LucideIcon,
} from 'lucide-react';
import WizardShell from '../_components/WizardShell';
import { cn } from '@/lib/utils';
import { useListingDraft } from '@/context/ListingDraftContext';

type Amenity = { id: string; label: string; icon: LucideIcon };

const CATEGORIES: { title: string; icon: LucideIcon; items: Amenity[] }[] = [
  {
    title: 'Essentials',
    icon: LayoutGrid,
    items: [
      { id: 'wifi', label: 'WiFi', icon: Wifi },
      { id: 'kitchen', label: 'Kitchen', icon: UtensilsCrossed },
      { id: 'ac', label: 'Air Conditioning', icon: Snowflake },
      { id: 'heating', label: 'Heating', icon: Thermometer },
      { id: 'tv', label: 'TV', icon: Tv },
      { id: 'washer', label: 'Washing Machine', icon: WashingMachine },
      { id: 'parking', label: 'Free Parking', icon: Car },
      { id: 'pets', label: 'Pets Allowed', icon: PawPrint },
    ],
  },
  {
    title: 'Features',
    icon: Star,
    items: [
      { id: 'pool', label: 'Pool', icon: Waves },
      { id: 'hottub', label: 'Hot Tub', icon: Bath },
      { id: 'balcony', label: 'Balcony', icon: DoorOpen },
      { id: 'deck', label: 'Deck', icon: Sun },
      { id: 'garden', label: 'Garden', icon: Trees },
      { id: 'bbq', label: 'BBQ Grill', icon: Flame },
      { id: 'fireplace', label: 'Indoor Fireplace', icon: Flame },
      { id: 'gym', label: 'Gym', icon: Dumbbell },
    ],
  },
  {
    title: 'Safety',
    icon: ShieldCheck,
    items: [
      { id: 'smoke', label: 'Smoke Alarm', icon: ShieldAlert },
      { id: 'extinguisher', label: 'Fire Extinguisher', icon: FireExtinguisher },
      { id: 'firstaid', label: 'First Aid Kit', icon: BriefcaseMedical },
      { id: 'emergency', label: 'Emergency Plan', icon: Siren },
    ],
  },
];

const LABELS = Object.fromEntries(
  CATEGORIES.flatMap((c) => c.items).map((i) => [i.id, i.label]),
);

// Maps the wizard's amenity ids to the DB amenities table's amenity_id.
const AMENITY_DB_ID: Record<string, number> = {
  wifi: 1, ac: 2, heating: 3, kitchen: 4, washer: 5, parking: 7, tv: 8,
  pool: 11, gym: 12, hottub: 13, balcony: 14, smoke: 16, extinguisher: 17,
  firstaid: 18, pets: 19, bbq: 21, garden: 22,
};

export default function AmenitiesPage() {
  const { draft, update } = useListingDraft();
  const [selected, setSelected] = useState<Set<string>>(() => {
    if (draft.amenityIds?.length) {
      const fromDraft = Object.entries(AMENITY_DB_ID)
        .filter(([, id]) => draft.amenityIds!.includes(id))
        .map(([key]) => key);
      return new Set(fromDraft);
    }
    return new Set(['wifi', 'kitchen']);
  });

  useEffect(() => {
    const ids = [...selected].map((k) => AMENITY_DB_ID[k]).filter(Boolean);
    update({ amenityIds: ids });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <WizardShell
      step={4}
      title="Tell guests what your place has to offer"
      subtitle="Select all the amenities you provide. You can update these anytime after publishing."
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: categories */}
        <div className="md:col-span-8 space-y-8">
          {CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;
            return (
              <section key={cat.title}>
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <CatIcon className="w-5 h-5 text-blue-600" />
                  {cat.title}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {cat.items.map((item) => {
                    const Icon = item.icon;
                    const active = selected.has(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggle(item.id)}
                        className={cn(
                          'flex flex-col items-center justify-center p-6 bg-white border rounded-xl h-full text-center transition-all hover:-translate-y-0.5',
                          active
                            ? 'border-blue-600 ring-1 ring-blue-600 bg-blue-50/40'
                            : 'border-gray-200 hover:border-gray-300',
                        )}
                      >
                        <Icon
                          className={cn(
                            'w-7 h-7 mb-3',
                            active ? 'text-blue-600' : 'text-gray-500',
                          )}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Right: sticky preview */}
        <div className="md:col-span-4 hidden md:block">
          <div className="sticky top-28">
            <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-200">
              <div className="relative w-full h-48 rounded-xl mb-4 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&h=400&fit=crop&q=80"
                  alt="Listing preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold">
                  Listing Preview
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                Coastal Modern Retreat
              </h3>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
                <MapPin className="w-4 h-4" />
                Malibu, California
              </div>
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Selected Amenities
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.size === 0 ? (
                    <span className="text-sm text-gray-400 italic">
                      No amenities selected yet
                    </span>
                  ) : (
                    [...selected].map((id) => (
                      <span
                        key={id}
                        className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        {LABELS[id]}
                      </span>
                    ))
                  )}
                </div>
              </div>
              <div className="mt-8 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Lightbulb className="w-5 h-5 text-blue-600 shrink-0" />
                  <p className="text-sm text-gray-700">
                    Guests often search for WiFi, Kitchen, and Free Parking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WizardShell>
  );
}
