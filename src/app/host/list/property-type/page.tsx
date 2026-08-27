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
      nextDisabled={!selected}
    >
      {/* Search (filtering coming soon) */}
      <div className="max-w-md mb-8">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            disabled
            title="Search is coming soon"
            placeholder="Search for property types… (coming soon)"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none text-gray-400 placeholder:text-gray-400 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Popular */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-1">
          Popular
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {POPULAR.map((opt) => {
            const Icon = opt.icon;
            const active = selected === opt.id;
            return (
              <OptionCard
                key={opt.id}
                selected={active}
                onClick={() => select(opt.id)}
                className="flex flex-row items-center gap-4"
              >
                <Icon className="w-6 h-6 text-gray-800 shrink-0" />
                <div className="flex flex-col">
                  <h3 className="text-sm md:text-base font-semibold text-gray-800">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {UNIQUE.map((opt) => {
            const Icon = opt.icon;
            const active = selected === opt.id;
            return (
              <OptionCard
                key={opt.id}
                selected={active}
                onClick={() => select(opt.id)}
                className="flex flex-row items-center gap-4"
              >
                <Icon className="w-6 h-6 text-gray-800 shrink-0" />
                <div className="flex flex-col">
                  <h3 className="text-sm md:text-base font-semibold text-gray-800">
                    {opt.name}
                  </h3>
                </div>
              </OptionCard>
            );
          })}
        </div>
      </section>
    </WizardShell>
  );
}
