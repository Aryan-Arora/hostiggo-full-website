'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
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
        on ? 'bg-blue-600' : 'bg-gray-300',
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
  const [priceWeekday, setPriceWeekday] = useState<number>(draft.priceWeekday ?? 2999);
  const [weekendOption, setWeekendOption] = useState<'same' | 'custom'>(
    draft.priceWeekend && draft.priceWeekend !== draft.priceWeekday ? 'custom' : 'same',
  );
  const [priceWeekend, setPriceWeekend] = useState<number>(
    draft.priceWeekend ?? Math.round((draft.priceWeekday ?? 2999) * 1.1),
  );

  const [discounts, setDiscounts] = useState({
    newListing: draft.discounts?.find((d) => d.discount_type === 'new_listing')?.enabled ?? true,
    weekly: draft.discounts?.find((d) => d.discount_type === 'weekly')?.enabled ?? true,
    monthly: draft.discounts?.find((d) => d.discount_type === 'monthly')?.enabled ?? false,
  });

  const [newListingPercent, setNewListingPercent] = useState<number>(
    draft.discounts?.find((d) => d.discount_type === 'new_listing')?.percent ?? DEFAULT_DISCOUNT_PERCENT.newListing,
  );
  const [weeklyPercent, setWeeklyPercent] = useState<number>(
    draft.discounts?.find((d) => d.discount_type === 'weekly')?.percent ?? DEFAULT_DISCOUNT_PERCENT.weekly,
  );
  const [monthlyPercent, setMonthlyPercent] = useState<number>(
    draft.discounts?.find((d) => d.discount_type === 'monthly')?.percent ?? DEFAULT_DISCOUNT_PERCENT.monthly,
  );

  // Sync pricing changes to draft
  useEffect(() => {
    const finalWeekendPrice = weekendOption === 'same' ? priceWeekday : priceWeekend;
    update({ priceWeekday, priceWeekend: finalWeekendPrice });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceWeekday, priceWeekend, weekendOption]);

  // Sync discount changes to draft
  useEffect(() => {
    update({
      discounts: [
        { discount_type: 'new_listing', percent: newListingPercent, enabled: discounts.newListing },
        { discount_type: 'weekly', percent: weeklyPercent, enabled: discounts.weekly },
        { discount_type: 'monthly', percent: monthlyPercent, enabled: discounts.monthly },
      ],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discounts, newListingPercent, weeklyPercent, monthlyPercent]);

  const toggleDiscount = (k: keyof typeof discounts) =>
    setDiscounts((d) => ({ ...d, [k]: !d[k] }));

  // Helper text calculation for weekend pricing
  const diff = priceWeekday > 0 ? Math.round(((priceWeekend - priceWeekday) / priceWeekday) * 100) : 0;
  const weekendHelperText =
    diff > 0
      ? `${diff}% higher than weekday price`
      : diff < 0
      ? `${Math.abs(diff)}% lower than weekday price`
      : 'Same as weekday price';

  return (
    <WizardShell
      step={8}
      title="Now, set your price"
      subtitle="You can change it anytime after you publish your listing."
      nextDisabled={priceWeekday <= 0 || (weekendOption === 'custom' && priceWeekend <= 0)}
    >
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: price */}
          <div className="md:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-card border border-gray-200">
              {/* Weekday Price */}
              <div>
                <h3 className="text-base font-bold text-gray-900">Weekday price</h3>
                <p className="text-xs text-gray-500 mt-1">Price per night from Monday to Thursday</p>

                <div className="flex items-center w-full bg-white border border-gray-300 rounded-xl px-4 py-3.5 mt-3 focus-within:ring-2 focus-within:ring-figma-navy focus-within:border-transparent transition-all">
                  <span className="text-gray-500 font-semibold text-lg mr-2 select-none">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={priceWeekday || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setPriceWeekday(val);
                      if (weekendOption === 'same') {
                        setPriceWeekend(val);
                      }
                    }}
                    placeholder="0"
                    className="w-full bg-transparent text-gray-900 font-bold text-lg outline-none"
                  />
                  <span className="text-gray-400 text-sm font-medium whitespace-nowrap ml-2 select-none">
                    / Night
                  </span>
                </div>
              </div>

              {/* Dotted horizontal divider */}
              <div className="border-t border-dotted border-gray-300 my-6" />

              {/* Weekend Price */}
              <div>
                <h3 className="text-base font-bold text-gray-900">Weekend price</h3>
                <p className="text-xs text-gray-500 mt-1">Price per night from Friday to Sunday</p>

                <div className="space-y-2.5 mt-3">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="weekendPricing"
                      value="same"
                      checked={weekendOption === 'same'}
                      onChange={() => {
                        setWeekendOption('same');
                        setPriceWeekend(priceWeekday);
                      }}
                      className="w-4 h-4 text-figma-navy border-gray-300 focus:ring-figma-navy"
                    />
                    <span className="text-sm font-medium text-gray-800">Same as weekday</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="weekendPricing"
                      value="custom"
                      checked={weekendOption === 'custom'}
                      onChange={() => {
                        setWeekendOption('custom');
                        if (priceWeekend === priceWeekday) {
                          setPriceWeekend(Math.round(priceWeekday * 1.1));
                        }
                      }}
                      className="w-4 h-4 text-figma-navy border-gray-300 focus:ring-figma-navy"
                    />
                    <span className="text-sm font-medium text-gray-800">Set a different price</span>
                  </label>
                </div>

                {weekendOption === 'custom' && (
                  <div className="mt-3">
                    <div className="flex items-center w-full bg-white border border-gray-300 rounded-xl px-4 py-3.5 focus-within:ring-2 focus-within:ring-figma-navy focus-within:border-transparent transition-all">
                      <span className="text-gray-500 font-semibold text-lg mr-2 select-none">₹</span>
                      <input
                        type="number"
                        min={0}
                        value={priceWeekend || ''}
                        onChange={(e) => setPriceWeekend(Number(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full bg-transparent text-gray-900 font-bold text-lg outline-none"
                      />
                      <span className="text-gray-400 text-sm font-medium whitespace-nowrap ml-2 select-none">
                        / Night
                      </span>
                    </div>
                    <div className="mt-1.5 pl-1">
                      <span className="text-[10px] text-gray-500">{weekendHelperText}</span>
                    </div>
                  </div>
                )}
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
          <div className="md:col-span-5 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Percent className="w-5 h-5 text-figma-navy" />
                <h3 className="text-lg font-bold text-gray-800">Add discounts (optional)</h3>
              </div>
              <p className="text-xs text-gray-500">
                Discounts help your place get booking faster, optional but useful
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-2.5">
                You can edit these discounts
              </p>

              <div className="space-y-3.5">
                {/* New listing discount */}
                <div
                  className={cn(
                    'p-5 rounded-2xl transition-all',
                    discounts.newListing
                      ? 'bg-white border border-gray-200 shadow-md'
                      : 'border border-dashed border-gray-300 bg-gray-50/60 shadow-none',
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 pr-2">
                      <h4 className="text-sm font-bold text-gray-800">New listing discount</h4>
                      <p className="text-xs text-gray-500">
                        Offer 20% off for your first 3 bookings to build reputation.
                      </p>
                      {discounts.newListing && (
                        <div className="pt-2">
                          <div className="inline-flex items-center border border-blue-400 rounded-md px-2 py-1 bg-white">
                            <input
                              type="number"
                              min={1}
                              max={99}
                              value={newListingPercent}
                              onChange={(e) =>
                                setNewListingPercent(
                                  Math.max(1, Math.min(99, Number(e.target.value) || 0)),
                                )
                              }
                              className="w-10 text-center text-sm font-bold text-gray-800 outline-none bg-transparent"
                            />
                            <span className="text-sm font-bold text-gray-600">%</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <Toggle
                      on={discounts.newListing}
                      onClick={() => toggleDiscount('newListing')}
                    />
                  </div>
                </div>

                {/* Weekly discount */}
                <div
                  className={cn(
                    'p-5 rounded-2xl transition-all',
                    discounts.weekly
                      ? 'bg-white border border-gray-200 shadow-md'
                      : 'border border-dashed border-gray-300 bg-gray-50/60 shadow-none',
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 pr-2">
                      <h4 className="text-sm font-bold text-gray-800">Weekly discount</h4>
                      <p className="text-xs text-gray-500">Offer for stays of 7 nights or more.</p>
                      {discounts.weekly && (
                        <div className="pt-2">
                          <div className="inline-flex items-center border border-blue-400 rounded-md px-2 py-1 bg-white">
                            <input
                              type="number"
                              min={1}
                              max={99}
                              value={weeklyPercent}
                              onChange={(e) =>
                                setWeeklyPercent(
                                  Math.max(1, Math.min(99, Number(e.target.value) || 0)),
                                )
                              }
                              className="w-10 text-center text-sm font-bold text-gray-800 outline-none bg-transparent"
                            />
                            <span className="text-sm font-bold text-gray-600">%</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <Toggle
                      on={discounts.weekly}
                      onClick={() => toggleDiscount('weekly')}
                    />
                  </div>
                </div>

                {/* Monthly discount */}
                <div
                  className={cn(
                    'p-5 rounded-2xl transition-all',
                    discounts.monthly
                      ? 'bg-white border border-gray-200 shadow-md'
                      : 'border border-dashed border-gray-300 bg-gray-50/60 shadow-none',
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 pr-2">
                      <h4 className="text-sm font-bold text-gray-800">Monthly discount</h4>
                      <p className="text-xs text-gray-500">Offer for stays of 28 nights or more.</p>
                      {discounts.monthly && (
                        <div className="pt-2">
                          <div className="inline-flex items-center border border-blue-400 rounded-md px-2 py-1 bg-white">
                            <input
                              type="number"
                              min={1}
                              max={99}
                              value={monthlyPercent}
                              onChange={(e) =>
                                setMonthlyPercent(
                                  Math.max(1, Math.min(99, Number(e.target.value) || 0)),
                                )
                              }
                              className="w-10 text-center text-sm font-bold text-gray-800 outline-none bg-transparent"
                            />
                            <span className="text-sm font-bold text-gray-600">%</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <Toggle
                      on={discounts.monthly}
                      onClick={() => toggleDiscount('monthly')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Banner */}
        <div className="relative h-56 rounded-2xl overflow-hidden mt-8">
          <Image
            fill
            src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=500&fit=crop&q=80"
            alt=""
            sizes="(max-width: 1024px) 100vw, 900px"
            className="object-cover"
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
