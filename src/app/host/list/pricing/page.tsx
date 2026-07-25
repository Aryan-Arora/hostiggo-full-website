'use client';

import { useEffect, useState } from 'react';
import { Lightbulb, Percent } from 'lucide-react';
import WizardShell from '../_components/WizardShell';
import { cn } from '@/lib/utils';
import { useListingDraft } from '@/context/ListingDraftContext';

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative w-12 h-7 rounded-full transition-colors shrink-0',
        on ? 'bg-figma-navy' : 'bg-gray-300',
      )}
      aria-pressed={on}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform',
          on && 'translate-x-5',
        )}
      />
    </button>
  );
}

const DEFAULT_DISCOUNT_PERCENT = { newListing: 20, weekly: 10, monthly: 15 };

export default function PricingPage() {
  const { draft, update } = useListingDraft();
  const [price, setPrice] = useState(draft.priceWeekday ?? 2999);
  const [discounts, setDiscounts] = useState({
    newListing: draft.discounts?.find((d) => d.discount_type === 'new_listing')?.enabled ?? true,
    weekly: draft.discounts?.find((d) => d.discount_type === 'weekly')?.enabled ?? true,
    monthly: draft.discounts?.find((d) => d.discount_type === 'monthly')?.enabled ?? false,
  });
  const [weeklyPercent, setWeeklyPercent] = useState(
    draft.discounts?.find((d) => d.discount_type === 'weekly')?.percent ?? DEFAULT_DISCOUNT_PERCENT.weekly,
  );

  useEffect(() => {
    update({ priceWeekday: price, priceWeekend: price });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price]);

  useEffect(() => {
    update({
      discounts: [
        { discount_type: 'new_listing', percent: DEFAULT_DISCOUNT_PERCENT.newListing, enabled: discounts.newListing },
        { discount_type: 'weekly', percent: weeklyPercent, enabled: discounts.weekly },
        { discount_type: 'monthly', percent: DEFAULT_DISCOUNT_PERCENT.monthly, enabled: discounts.monthly },
      ],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discounts, weeklyPercent]);

  const toggle = (k: keyof typeof discounts) =>
    setDiscounts((d) => ({ ...d, [k]: !d[k] }));

  const guestPrice = Math.round(price * 1.14);
  const earn = Math.round(price * 0.97);
  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <WizardShell
      step={8}
      title="Now, set your price"
      subtitle="You can change it anytime after you publish your listing."
    >
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: price */}
          <div className="md:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-card border border-gray-200 transition-all hover:border-figma-navy/30">
              <label className="block text-sm text-gray-500 mb-4">
                Price per night
              </label>
              <div className="flex items-center gap-4">
                <span className="text-4xl font-bold text-gray-900">₹</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value) || 0)}
                  className="w-full text-4xl font-bold border-none p-0 bg-transparent focus:ring-0 outline-none text-gray-900"
                />
              </div>
              <div className="mt-8 pt-8 border-t border-gray-100 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Base price</span>
                  <span className="text-sm font-semibold text-gray-800">{fmt(price)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Guest price (before taxes)</span>
                  <span className="text-sm font-semibold text-gray-800">{fmt(guestPrice)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-dashed border-gray-200">
                  <span className="text-sm font-bold text-figma-navy">You earn</span>
                  <span className="text-xl font-bold text-figma-navy">{fmt(earn)}</span>
                </div>
              </div>
            </div>

            <div className="bg-figma-navy/6 border border-figma-navy/20 rounded-2xl p-6 flex gap-4 items-start">
              <Lightbulb className="w-5 h-5 text-figma-navy mt-0.5 shrink-0" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-figma-navy">Tip: Stay competitive</h4>
                <p className="text-sm text-gray-600">
                  Check what similar homestays nearby are charging before you finalize
                  your price -- you can always adjust it later.
                </p>
              </div>
            </div>
          </div>

          {/* Right: discounts */}
          <div className="md:col-span-5">
            <div className="bg-white rounded-2xl p-8 shadow-card border border-gray-200 h-full">
              <div className="flex items-center gap-2 mb-6">
                <Percent className="w-5 h-5 text-figma-navy" />
                <h3 className="text-lg font-bold text-gray-800">Add discounts</h3>
              </div>
              <p className="text-sm text-gray-500 mb-8">
                Increase your booking chances by offering these popular discounts.
              </p>
              <div className="space-y-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-gray-800">New listing discount</h4>
                    <p className="text-xs text-gray-500">
                      Offer 20% off for your first 3 bookings to build reputation.
                    </p>
                  </div>
                  <Toggle on={discounts.newListing} onClick={() => toggle('newListing')} />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-gray-800">Weekly discount</h4>
                    <p className="text-xs text-gray-500">Offer for stays of 7 nights or more.</p>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={weeklyPercent}
                        onChange={(e) => setWeeklyPercent(Number(e.target.value) || 0)}
                        className="w-16 border border-gray-200 rounded-lg p-1 text-center text-sm outline-none focus:ring-2 focus:ring-figma-navy"
                      />
                      <span className="text-sm text-gray-600">%</span>
                    </div>
                  </div>
                  <Toggle on={discounts.weekly} onClick={() => toggle('weekly')} />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-gray-800">Monthly discount</h4>
                    <p className="text-xs text-gray-500">Offer for stays of 28 nights or more.</p>
                  </div>
                  <Toggle on={discounts.monthly} onClick={() => toggle('monthly')} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Banner */}
        <div className="relative h-56 rounded-2xl overflow-hidden mt-8">
          <img
            src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=500&fit=crop&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-figma-navy/80 to-figma-navy/20" />
          <div className="absolute inset-0 flex items-center justify-center text-center px-6">
            <div>
              <h3 className="text-xl font-bold text-white">Trust and Security</h3>
              <p className="text-sm text-white/80">
                Every booking is protected by Hostiggo Damage Protection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </WizardShell>
  );
}
