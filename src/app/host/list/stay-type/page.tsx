'use client';

import { useState } from 'react';
import WizardShell, { OptionCard } from '../_components/WizardShell';
import { useListingDraft } from '@/context/ListingDraftContext';

const STAY_TYPES = [
  {
    id: 'entire',
    name: 'Entire property',
    desc: 'Guests book entire property for their stay',
    image: '/images/stay-types/entire-property.png',
  },
  {
    id: 'private',
    name: 'Private Room',
    desc: 'Guest stay in a private room and share common areas',
    image: '/images/stay-types/private-room.png',
  },
  {
    id: 'shared',
    name: 'Shared Space',
    desc: 'Guests share living or sleeping areas with others',
    image: '/images/stay-types/shared-space.png',
  },
];

export default function StayTypePage() {
  const { draft, update } = useListingDraft();
  const [selected, setSelected] = useState<string>(draft.stayType || '');

  const select = (id: string) => {
    setSelected(id);
    update({ stayType: id });
  };

  return (
    <WizardShell
      step={2}
      title="How will guests stay at your property?"
      nextDisabled={!selected}
    >
      <div className="max-w-2xl mx-auto space-y-4">
        {STAY_TYPES.map((type) => {
          return (
            <OptionCard
              key={type.id}
              selected={selected === type.id}
              onClick={() => select(type.id)}
              className="flex items-center gap-6 p-4 w-full"
            >
              <div className="w-24 h-24 rounded-xl flex items-center justify-center shrink-0">
                <img
                  src={type.image}
                  alt={type.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-[17px] font-bold text-gray-900 mb-1">
                  {type.name}
                </h3>
                <p className="text-[14px] text-gray-500">{type.desc}</p>
              </div>
            </OptionCard>
          );
        })}
      </div>
    </WizardShell>
  );
}
