'use client';

import { useEffect, useState } from 'react';
import { Lightbulb, PlusCircle, Sparkles } from 'lucide-react';
import WizardShell from '../_components/WizardShell';
import { useListingDraft } from '@/context/ListingDraftContext';

const SUGGESTIONS = [
  {
    group: 'General',
    titles: ['Cozy stay near the city centre', 'Comfortable home for relaxing stay'],
  },
  { group: 'Nature & Calm', titles: ['Serene stay surrounded by nature'] },
  { group: 'Premium / Family', titles: ['Spacious home ideal for families'] },
];

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
      title="Now, let's give your place a title and description"
      subtitle="Short, catchy titles work best. Describe what makes your place special to attract more guests."
      nextDisabled={!title.trim()}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: inputs */}
        <div className="md:col-span-7">
          <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-200 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label htmlFor="property-title" className="text-sm font-medium text-gray-800">
                  Property Title
                </label>
                <span className="text-xs text-gray-400">{title.length} / 50</span>
              </div>
              <input
                id="property-title"
                type="text"
                maxLength={50}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Cozy Cottage near the mountains"
                className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-figma-navy focus:border-transparent transition-all outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="property-desc" className="text-sm font-medium text-gray-800">
                Description
              </label>
              <textarea
                id="property-desc"
                rows={6}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Tell guests about your space, neighborhood, and amenities..."
                className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-figma-navy focus:border-transparent transition-all outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right: suggestions */}
        <div className="md:col-span-5">
          <div className="bg-gray-50 rounded-2xl p-6 sticky top-28 border border-gray-200">
            <div className="flex items-center gap-2 mb-4 text-figma-navy">
              <Lightbulb className="w-5 h-5 fill-figma-navy" />
              <h2 className="text-lg font-bold">Suggested Titles</h2>
            </div>
            <div className="flex flex-col gap-4">
              {SUGGESTIONS.map((cat) => (
                <div key={cat.group}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    {cat.group}
                  </p>
                  <div className="space-y-2">
                    {cat.titles.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTitle(t.slice(0, 50))}
                        className="w-full text-left p-3.5 rounded-xl bg-white hover:bg-figma-navy/5 transition-colors border border-gray-200 flex justify-between items-center group"
                      >
                        <span className="text-sm text-gray-800">{t}</span>
                        <PlusCircle className="w-5 h-5 text-gray-300 group-hover:text-figma-navy transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-figma-navy rounded-xl text-white relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-sm font-bold mb-1">Pro Tip</p>
                <p className="text-xs opacity-90 leading-relaxed">
                  A detailed description helps guests know what to expect. Mention
                  unique features like &quot;high-speed wifi&quot; or &quot;morning sun&quot;.
                </p>
              </div>
              <Sparkles className="absolute -bottom-3 -right-3 w-20 h-20 opacity-20" />
            </div>
          </div>
        </div>
      </div>
    </WizardShell>
  );
}
