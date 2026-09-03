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
        <div className="space-y-12">
          {/* Weekday Price */}
          <div className="space-y-5">
            <div>
              <h3 className="text-[20px] font-bold text-gray-900">Weekday price</h3>
              <p className="text-[15px] text-gray-500">Price per night from Monday to Thursday</p>
            </div>
            <div className="flex items-center border-2 border-gray-200 rounded-2xl overflow-hidden focus-within:border-figma-navy focus-within:bg-figma-navy/5 transition-all">
              <div className="pl-5 pr-2 text-[24px] font-extrabold text-gray-900">₹</div>
              <input
                type="number"
                min={0}
                value={weekdayPrice}
                onChange={(e) => setWeekdayPrice(Number(e.target.value) || 0)}
                className="w-full py-5 text-[24px] font-extrabold outline-none border-none focus:ring-0 text-gray-900 placeholder:text-gray-300 bg-transparent"
              />
              <div className="pr-5 pl-2 text-[15px] font-bold text-gray-400 whitespace-nowrap bg-transparent">
                / Night
              </div>
            </div>
          </div>

          <hr className="border-t border-gray-200" />

          {/* Weekend Price */}
          <div className="space-y-5">
            <div>
              <h3 className="text-[20px] font-bold text-gray-900">Weekend price</h3>
              <p className="text-[15px] text-gray-500">Price per night from Friday to Sunday</p>
            </div>

            <div className="space-y-4 pt-2">
              <label className="flex items-center gap-4 cursor-pointer group p-4 border-2 border-gray-100 rounded-2xl hover:border-gray-200 transition-colors">
                <div className="relative flex items-center justify-center">
                  <input
                    type="radio"
                    name="weekendMode"
                    className="peer sr-only"
                    checked={sameAsWeekday}
                    onChange={() => setSameAsWeekday(true)}
                  />
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 peer-checked:border-figma-navy flex items-center justify-center transition-colors">
                    {sameAsWeekday && <div className="w-2.5 h-2.5 rounded-full bg-figma-navy" />}
                  </div>
                </div>
                <span className="text-[16px] font-bold text-gray-600 group-hover:text-gray-900 transition-colors">Same as weekday</span>
              </label>

              <label className="flex items-center gap-4 cursor-pointer group p-4 border-2 border-gray-100 rounded-2xl hover:border-gray-200 transition-colors">
                <div className="relative flex items-center justify-center">
                  <input
                    type="radio"
                    name="weekendMode"
                    className="peer sr-only"
                    checked={!sameAsWeekday}
                    onChange={() => setSameAsWeekday(false)}
                  />
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 peer-checked:border-figma-navy flex items-center justify-center transition-colors">
                    {!sameAsWeekday && <div className="w-2.5 h-2.5 rounded-full bg-figma-navy" />}
                  </div>
                </div>
                <span className={`text-[16px] font-bold transition-colors ${!sameAsWeekday ? 'text-figma-navy' : 'text-gray-600 group-hover:text-gray-900'}`}>
                  Set a different price
                </span>
              </label>
            </div>

            {!sameAsWeekday && (
              <div className="pt-4 space-y-3 animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="flex items-center border-2 border-gray-200 rounded-2xl overflow-hidden focus-within:border-figma-navy focus-within:bg-figma-navy/5 transition-all">
                  <div className="pl-5 pr-2 text-[24px] font-extrabold text-gray-900">₹</div>
                  <input
                    type="number"
                    min={0}
                    value={weekendPrice}
                    onChange={(e) => setWeekendPrice(Number(e.target.value) || 0)}
                    className="w-full py-5 text-[24px] font-extrabold outline-none border-none focus:ring-0 text-gray-900 placeholder:text-gray-300 bg-transparent"
                  />
                  <div className="pr-5 pl-2 text-[15px] font-bold text-gray-400 whitespace-nowrap bg-transparent">
                    / Night
                  </div>
                </div>
                {diffPercent !== 0 && (
                  <p className={`text-[13px] font-bold flex items-center gap-2 ml-1 ${diffPercent > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white ${diffPercent > 0 ? 'bg-emerald-500' : 'bg-amber-500'}`}>!</span>
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
