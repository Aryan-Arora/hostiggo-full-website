'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useListingDraft } from '@/context/ListingDraftContext';
import AiFlowShell from '../_components/AiFlowShell';
import { loadGeneratedListing, type AiGeneratedListing } from '../_lib/aiImportDraft';

const SECTIONS = [
  'Basic Information',
  'Description',
  'Property Details',
  'Photos',
  'Amenities',
  'House Rules',
  'Pricing',
] as const;
type Section = (typeof SECTIONS)[number];

export default function AiReviewPage() {
  const router = useRouter();
  const { update } = useListingDraft();
  const [generated, setGenerated] = useState<AiGeneratedListing | null>(null);
  const [activeSection, setActiveSection] = useState<Section>('Basic Information');

  // The three "Listing Title" fields below are a literal match to the
  // provided design (a genuine duplicate, not a typo) -- only the first is
  // what actually gets saved on Save Changes.
  const [titleA, setTitleA] = useState('');
  const [titleB, setTitleB] = useState('');
  const [titleC, setTitleC] = useState('');
  const [description, setDescription] = useState('');
  const [numGuests, setNumGuests] = useState(0);
  const [numBedrooms, setNumBedrooms] = useState(0);
  const [numBeds, setNumBeds] = useState(0);
  const [numBathrooms, setNumBathrooms] = useState(0);
  const [priceWeekday, setPriceWeekday] = useState(0);
  const [priceWeekend, setPriceWeekend] = useState(0);

  useEffect(() => {
    const g = loadGeneratedListing();
    if (!g) {
      // Nothing generated yet -- send them back to start the import.
      router.replace('/host/list/ai/setup');
      return;
    }
    setGenerated(g);
    setTitleA(g.title);
    setTitleB(g.title);
    setTitleC(g.title);
    setDescription(g.description);
    setNumGuests(g.numGuests);
    setNumBedrooms(g.numBedrooms);
    setNumBeds(g.numBeds);
    setNumBathrooms(g.numBathrooms);
    setPriceWeekday(g.priceWeekday);
    setPriceWeekend(g.priceWeekend);
  }, [router]);

  if (!generated) return null;

  const handleSaveAndContinue = () => {
    update({
      title: titleA,
      description,
      numGuests,
      numBedrooms,
      numBeds,
      numBathrooms,
      priceWeekday,
      priceWeekend,
      // Sensible defaults for fields this flow doesn't collect -- a host
      // publishing via AI import hasn't gone through the manual wizard's
      // property-type/stay-type steps, so createListing needs something.
      propertyType: 'apartment',
      stayType: 'entire',
    });
    router.push('/host/list/ai/publish');
  };

  return (
    <AiFlowShell stage="review" onBack={() => router.push('/host/list/ai/processing')}>
      <button
        type="button"
        onClick={() => router.push('/host/list/ai/processing')}
        className="text-sm font-semibold text-figma-navy hover:underline mb-4 inline-block"
      >
        ← Back to Review
      </button>

      <div className="flex items-center gap-2 mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Edit Listing Details</h1>
        <span className="text-[11px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 rounded-full px-2.5 py-1">
          Editing
        </span>
      </div>
      <p className="text-gray-500 mb-8">Make changes to your AI-generated listing before publishing.</p>

      <div className="grid md:grid-cols-[1fr_280px] gap-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-6 space-y-6">
          {activeSection === 'Basic Information' && (
            <div>
              <p className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4">
                <span className="w-5 h-5 rounded-full bg-figma-navy/10 text-figma-navy text-xs flex items-center justify-center">1</span>
                Basic Information
              </p>
              {[
                { value: titleA, set: setTitleA },
                { value: titleB, set: setTitleB },
                { value: titleC, set: setTitleC },
              ].map((f, i) => (
                <div key={i} className="mb-3">
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">
                    Listing Title<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-figma-navy focus:ring-1 focus:ring-figma-navy transition-all"
                  />
                </div>
              ))}
            </div>
          )}

          {activeSection === 'Description' && (
            <div>
              <p className="text-sm font-bold text-gray-900 mb-4">Description</p>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">
                Property Description<span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-figma-navy focus:ring-1 focus:ring-figma-navy transition-all resize-none"
              />
            </div>
          )}

          {activeSection === 'Property Details' && (
            <div>
              <p className="text-sm font-bold text-gray-900 mb-4">Property Details</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Guests', value: numGuests, set: setNumGuests },
                  { label: 'Bedrooms', value: numBedrooms, set: setNumBedrooms },
                  { label: 'Beds', value: numBeds, set: setNumBeds },
                  { label: 'Bathrooms', value: numBathrooms, set: setNumBathrooms },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">
                      {f.label}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={f.value}
                      onChange={(e) => f.set(Number(e.target.value) || 0)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-figma-navy focus:ring-1 focus:ring-figma-navy transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'Photos' && (
            <div>
              <p className="text-sm font-bold text-gray-900 mb-4">Photos</p>
              <p className="text-sm text-gray-500">
                {generated.photosImported} photos were imported by the AI. Photo management for
                AI-imported listings isn&apos;t available yet — edit photos from your listing
                once it&apos;s published.
              </p>
            </div>
          )}

          {activeSection === 'Amenities' && (
            <div>
              <p className="text-sm font-bold text-gray-900 mb-4">Amenities</p>
              <p className="text-sm text-gray-500">
                {generated.amenitiesFound} amenities were detected by the AI. Fine-grained
                amenity editing for AI-imported listings isn&apos;t available yet — edit amenities
                from your listing once it&apos;s published.
              </p>
            </div>
          )}

          {activeSection === 'House Rules' && (
            <div>
              <p className="text-sm font-bold text-gray-900 mb-4">House Rules</p>
              <p className="text-sm text-gray-500">
                Default house rules will be applied. Edit house rules from your listing once
                it&apos;s published.
              </p>
            </div>
          )}

          {activeSection === 'Pricing' && (
            <div>
              <p className="text-sm font-bold text-gray-900 mb-4">Pricing</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">
                    Weekday price
                  </label>
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-figma-navy focus-within:ring-1 focus-within:ring-figma-navy transition-all">
                    <span className="pl-4 pr-1 text-gray-500">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={priceWeekday}
                      onChange={(e) => setPriceWeekday(Number(e.target.value) || 0)}
                      className="w-full py-2.5 pr-4 text-sm text-gray-900 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">
                    Weekend price
                  </label>
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-figma-navy focus-within:ring-1 focus-within:ring-figma-navy transition-all">
                    <span className="pl-4 pr-1 text-gray-500">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={priceWeekend}
                      onChange={(e) => setPriceWeekend(Number(e.target.value) || 0)}
                      className="w-full py-2.5 pr-4 text-sm text-gray-900 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800">Review AI content</p>
              <p className="text-xs text-amber-700">
                Please verify all AI-generated information for accuracy, especially pricing,
                house rules, and amenities.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500 px-4 pt-4 pb-2">
              Edit sections
            </p>
            {SECTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setActiveSection(s)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 text-sm font-medium border-t border-gray-100 transition-colors',
                  activeSection === s
                    ? 'text-figma-navy bg-figma-navy/5 font-bold'
                    : 'text-gray-700 hover:bg-gray-50',
                )}
              >
                {s}
                <ChevronRight className="w-4 h-4" />
              </button>
            ))}
          </div>
        </aside>
      </div>

      <div className="fixed bottom-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-16 lg:px-20 py-5 bg-white border-t border-gray-200 shadow-lg">
        <button
          type="button"
          onClick={() => router.push('/host/listings')}
          className="px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all active:scale-95"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={handleSaveAndContinue}
          className="rounded-lg px-8 py-2.5 text-sm font-bold text-white bg-figma-navy hover:bg-figma-navy/90 transition-all active:scale-95 shadow-sm"
        >
          Save Changes and return to review
        </button>
      </div>
      <div className="h-20" />
    </AiFlowShell>
  );
}
