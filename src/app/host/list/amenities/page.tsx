'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Check, Lightbulb, MapPin } from 'lucide-react';
import WizardShell from '../_components/WizardShell';
import AmenityGrid from '@/components/features/AmenityGrid';
import { LABELS, dbIdsFromStringIds, stringIdsFromDbIds } from '@/lib/amenityCatalog';
import { useListingDraft } from '@/context/ListingDraftContext';

export default function AmenitiesPage() {
  const { draft, update } = useListingDraft();
  const [selected, setSelected] = useState<Set<string>>(() => {
    const fromDraft = stringIdsFromDbIds(draft.amenityIds);
    return fromDraft.size > 0 ? fromDraft : new Set(['wifi', 'kitchen']);
  });

  useEffect(() => {
    update({ amenityIds: dbIdsFromStringIds(selected) });
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
      step={6}
      title="Tell guests what your place has to offer"
      subtitle="Select all the amenities you provide. You can update these anytime after publishing."
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: categories */}
        <div className="md:col-span-8">
          <AmenityGrid selected={selected} onToggle={toggle} />
        </div>

        {/* Right: sticky preview */}
        <div className="md:col-span-4 hidden md:block">
          <div className="sticky top-28">
            <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-200">
              <div className="relative w-full h-48 rounded-xl mb-4 overflow-hidden bg-gray-100 flex items-center justify-center">
                {draft.photoUrls?.[0] ? (
                  <Image
                    fill
                    src={draft.photoUrls[0]}
                    alt="Listing preview"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <span className="text-xs text-gray-400">Photos added later will show here</span>
                )}
                <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold">
                  Listing Preview
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                {draft.title || 'Your listing title'}
              </h3>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
                <MapPin className="w-4 h-4" />
                {draft.addressLine1 || 'Location added earlier in the wizard'}
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
                        className="bg-figma-navy/5 text-figma-navy px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
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
                  <Lightbulb className="w-5 h-5 text-figma-navy shrink-0" />
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
