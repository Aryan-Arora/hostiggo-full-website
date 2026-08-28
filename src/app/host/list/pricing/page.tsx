'use client';

import { useEffect, useState } from 'react';
import WizardShell from '../_components/WizardShell';
import { useListingDraft } from '@/context/ListingDraftContext';

export default function PricingPage() {
  const { draft, update } = useListingDraft();

  const [weekdayPrice, setWeekdayPrice] = useState(draft.priceWeekday ?? 2999);

  // If priceWeekend exists and is different, we start in 'different' mode
  const initialSame = draft.priceWeekend === undefined || draft.priceWeekend === draft.priceWeekday;
  const [sameAsWeekday, setSameAsWeekday] = useState(initialSame);

  const [weekendPrice, setWeekendPrice] = useState(
    draft.priceWeekend ?? Math.round((draft.priceWeekday ?? 2999) * 1.1),
  );

  useEffect(() => {
    update({
      priceWeekday: weekdayPrice,
      priceWeekend: sameAsWeekday ? weekdayPrice : weekendPrice,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekdayPrice, weekendPrice, sameAsWeekday]);

  // Calculate percentage difference
  const effectiveWeekend = sameAsWeekday ? weekdayPrice : weekendPrice;
  const diffPercent =
    weekdayPrice > 0 ? Math.round(((effectiveWeekend - weekdayPrice) / weekdayPrice) * 100) : 0;

  // Payout preview, same formula the single-price card always showed --
  // kept here so a host still sees their actual take-home before
  // publishing, broken out per weekday/weekend since those can now differ.
  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  const guestPrice = (base: number) => Math.round(base * 1.14);
  const earn = (base: number) => Math.round(base * 0.97);

  return (
    <WizardShell
      step={10}
      title="Set your price"
      subtitle="You can change it anytime after you publish your listing."
      nextDisabled={weekdayPrice <= 0 || (!sameAsWeekday && weekendPrice <= 0)}
    >
      <div className="max-w-xl">
        <div className="space-y-10">
          {/* Weekday Price */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Weekday price</h3>
              <p className="text-sm text-gray-500">Price per night from Monday to Thursday</p>
            </div>

            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:border-figma-navy focus-within:ring-1 focus-within:ring-figma-navy transition-shadow">
              <div className="pl-4 pr-2 text-lg font-medium text-gray-900">₹</div>
              <input
                type="number"
                min={0}
                value={weekdayPrice}
                onChange={(e) => setWeekdayPrice(Number(e.target.value) || 0)}
                className="w-full py-3.5 text-base font-medium outline-none border-none focus:ring-0 text-gray-900 placeholder:text-gray-400"
              />
              <div className="pr-4 pl-2 text-sm text-gray-500 border-l border-transparent bg-transparent whitespace-nowrap">
                / Night
              </div>
            </div>
          </div>

          <hr className="border-t border-dashed border-gray-400" />

          {/* Weekend Price */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Weekend price</h3>
              <p className="text-sm text-gray-500">Price per night from Friday to Sunday</p>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="radio"
                    name="weekendMode"
                    className="peer sr-only"
                    checked={sameAsWeekday}
                    onChange={() => setSameAsWeekday(true)}
                  />
                  <div className="w-4 h-4 rounded-full border border-gray-300 peer-checked:border-figma-navy flex items-center justify-center">
                    {sameAsWeekday && <div className="w-2 h-2 rounded-full bg-figma-navy" />}
                  </div>
                </div>
                <span className="text-sm text-gray-500 group-hover:text-gray-700">Same as weekday</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="radio"
                    name="weekendMode"
                    className="peer sr-only"
                    checked={!sameAsWeekday}
                    onChange={() => setSameAsWeekday(false)}
                  />
                  <div className="w-4 h-4 rounded-full border border-gray-300 peer-checked:border-figma-navy flex items-center justify-center">
                    {!sameAsWeekday && <div className="w-2 h-2 rounded-full bg-figma-navy" />}
                  </div>
                </div>
                <span
                  className={`text-sm ${!sameAsWeekday ? 'text-figma-navy font-medium' : 'text-gray-500 group-hover:text-gray-700'}`}
                >
                  Set a different price
                </span>
              </label>
            </div>

            {!sameAsWeekday && (
              <div className="pt-2 space-y-2">
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:border-figma-navy focus-within:ring-1 focus-within:ring-figma-navy transition-shadow">
                  <div className="pl-4 pr-2 text-lg font-medium text-gray-900">₹</div>
                  <input
                    type="number"
                    min={0}
                    value={weekendPrice}
                    onChange={(e) => setWeekendPrice(Number(e.target.value) || 0)}
                    className="w-full py-3.5 text-base font-medium outline-none border-none focus:ring-0 text-gray-900 placeholder:text-gray-400"
                  />
                  <div className="pr-4 pl-2 text-sm text-gray-500 border-l border-transparent bg-transparent whitespace-nowrap">
                    / Night
                  </div>
                </div>
                {diffPercent !== 0 && (
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 ml-1">
                    <span className="w-3 h-3 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-600">
                      !
                    </span>
                    {Math.abs(diffPercent)}% {diffPercent > 0 ? 'higher' : 'lower'} than weekday price
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Payout breakdown -- what the host actually sees before publishing */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-200 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Weekday: guest price (before taxes)</span>
              <span className="text-sm font-semibold text-gray-800">{fmt(guestPrice(weekdayPrice))}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Weekend: guest price (before taxes)</span>
              <span className="text-sm font-semibold text-gray-800">{fmt(guestPrice(effectiveWeekend))}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-dashed border-gray-200">
              <span className="text-sm font-bold text-figma-navy">You earn (weekday / weekend)</span>
              <span className="text-lg font-bold text-figma-navy">
                {fmt(earn(weekdayPrice))} / {fmt(earn(effectiveWeekend))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </WizardShell>
  );
}
