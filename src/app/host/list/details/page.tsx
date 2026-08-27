'use client';

import { useEffect, useState } from 'react';
import WizardShell from '../_components/WizardShell';
import { useListingDraft } from '@/context/ListingDraftContext';

export default function DetailsPage() {
  const { draft, update } = useListingDraft();
  const [title, setTitle] = useState(draft.title ?? '');
  const [desc, setDesc] = useState(draft.description ?? '');

  // Persist to the wizard draft as the host types.
  useEffect(() => {
    update({ title, description: desc });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, desc]);

  return (
    <WizardShell
      step={7}
      title="Describe your property"
      subtitle="Share what guests can expect during their stay"
      nextDisabled={!title.trim()}
    >
      <div className="w-full max-w-2xl flex flex-col gap-8">
        {/* Property Title Section */}
        <div className="flex flex-col gap-2">
          <label htmlFor="property-title" className="text-sm font-medium text-gray-800">
            Property Title
          </label>
          <input
            id="property-title"
            type="text"
            maxLength={50}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Cozy Cottage near the mountains"
            className="w-full bg-white border border-gray-300 rounded-xl p-4 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-figma-navy focus:border-transparent transition-all outline-none"
          />
          <div className="flex justify-end">
            <span className="text-xs text-gray-400 font-medium">
              {title.length}/50
            </span>
          </div>
        </div>

        {/* Description Section */}
        <div className="flex flex-col gap-2">
          <label htmlFor="property-desc" className="text-sm font-medium text-gray-800">
            Description
          </label>
          <textarea
            id="property-desc"
            rows={6}
            maxLength={500}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Tell guests about your space, neighborhood, and amenities..."
            className="w-full bg-white border border-gray-300 rounded-xl p-4 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-figma-navy focus:border-transparent transition-all outline-none resize-none min-h-[150px]"
          />
          <div className="flex justify-end">
            <span className="text-xs text-gray-400 font-medium">
              {desc.length}/500
            </span>
          </div>
        </div>
      </div>
    </WizardShell>
  );
}
