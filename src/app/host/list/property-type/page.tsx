'use client';

import { useState } from 'react';
import {
  Search,
  Home,
  Building2,
  BedDouble,
  Hotel,
  TreePine,
  Castle,
  Trees,
  Tractor,
} from 'lucide-react';
import WizardShell, { OptionCard } from '../_components/WizardShell';
import { cn } from '@/lib/utils';
import { useListingDraft } from '@/context/ListingDraftContext';

// ids match the `type_id` column in the property_types table so createListing
// can resolve them straight to a property_type_id foreign key.
const POPULAR = [
  { id: 'house', icon: Home, name: 'House', desc: 'A standalone home with private indoor spaces.' },
  { id: 'apartment', icon: Building2, name: 'Apartment / Flat', desc: 'A private unit within a residential building.' },
  { id: 'guest-house', icon: BedDouble, name: 'Guest House', desc: 'A separate property designed for hosting guests.' },
  { id: 'hotel', icon: Hotel, name: 'Hotel', desc: 'A professionally managed property with multiple rooms.' },
];

const UNIQUE = [
  { id: 'cabin', icon: TreePine, name: 'Cabin' },
  { id: 'villa', icon: Castle, name: 'Villa' },
  { id: 'tree-house', icon: Trees, name: 'Treehouse' },
  { id: 'tiny-home', icon: Home, name: 'Tiny Home' },
  { id: 'farm-stay', icon: Tractor, name: 'Farm Stay' },
];

export default function PropertyTypePage() {
  const { draft, update } = useListingDraft();
  const [selected, setSelected] = useState<string>(draft.propertyType || 'house');

  const select = (id: string) => {
    setSelected(id);
    update({ propertyType: id });
  };

  return (
    <WizardShell
      step={1}
      title="What kind of property are you listing?"
      subtitle="Choose the category that best describes your space to help guests find exactly what they're looking for."
      nextDisabled={!selected}
    >
      {/* Search (filtering coming soon) */}
      <div className="max-w-md mx-auto mb-8">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            disabled
            title="Search is coming soon"
            placeholder="Search for property types… (coming soon)"
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-full text-sm outline-none shadow-card text-gray-400 placeholder:text-gray-400 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Popular */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-1">
          Popular
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {POPULAR.map((opt) => {
            const Icon = opt.icon;
            const active = selected === opt.id;
            return (
              <OptionCard
                key={opt.id}
                selected={active}
                onClick={() => select(opt.id)}
                className="flex flex-col items-start gap-4"
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
                    active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-blue-600',
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800 mb-1">
                    {opt.name}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {opt.desc}
                  </p>
                </div>
              </OptionCard>
            );
          })}
        </div>
      </section>

      {/* Unique stays */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-1">
          Unique Stays
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {UNIQUE.map((opt) => {
            const Icon = opt.icon;
            const active = selected === opt.id;
            return (
              <OptionCard
                key={opt.id}
                selected={active}
                onClick={() => select(opt.id)}
                className="flex flex-col items-center text-center gap-3 p-4"
              >
                <Icon
                  className={cn(
                    'w-7 h-7',
                    active ? 'text-blue-600' : 'text-gray-500',
                  )}
                />
                <span className="text-sm font-medium text-gray-700">
                  {opt.name}
                </span>
              </OptionCard>
            );
          })}
        </div>
      </section>

      {/* Help note */}
      <div className="mt-8 p-5 rounded-2xl bg-white border border-gray-200 shadow-card flex items-center gap-6">
        <div className="hidden md:block w-24 h-24 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
          <img
            src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=300&h=300&fit=crop&q=80"
            alt="Cozy interior"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h4 className="text-base font-bold text-gray-800 mb-1">
            Not sure which to choose?
          </h4>
          <p className="text-sm text-gray-500 leading-relaxed">
            Don&apos;t worry, you can always change your property category later
            in your listing settings. For now, pick the one that matches the core
            structure of your space.
          </p>
        </div>
      </div>
    </WizardShell>
  );
}
