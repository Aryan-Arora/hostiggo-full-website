'use client';

import { useEffect, useState } from 'react';
import WizardShell from '../_components/WizardShell';
import { useListingDraft } from '@/context/ListingDraftContext';
import { cn } from '@/lib/utils';

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors shrink-0',
        on ? 'bg-blue-600' : 'bg-gray-200',
      )}
      aria-pressed={on}
    >
      <span
        className={cn(
          'absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white shadow transition-transform',
          on && 'translate-x-5',
        )}
      />
    </button>
  );
}

const DEFAULT_DISCOUNT_PERCENT = { newListing: 20, weekly: 10, monthly: 15 };

export default function DiscountPage() {
  const { draft, update } = useListingDraft();

  const [discounts, setDiscounts] = useState({
    newListing: draft.discounts?.find((d) => d.discount_type === 'new_listing')?.enabled ?? true,
    weekly: draft.discounts?.find((d) => d.discount_type === 'weekly')?.enabled ?? false,
    monthly: draft.discounts?.find((d) => d.discount_type === 'monthly')?.enabled ?? false,
  });

  const [percents, setPercents] = useState({
    newListing: DEFAULT_DISCOUNT_PERCENT.newListing, // Usually fixed, but allowing state just in case
    weekly: draft.discounts?.find((d) => d.discount_type === 'weekly')?.percent ?? DEFAULT_DISCOUNT_PERCENT.weekly,
    monthly: draft.discounts?.find((d) => d.discount_type === 'monthly')?.percent ?? DEFAULT_DISCOUNT_PERCENT.monthly,
  });

  useEffect(() => {
    update({
      discounts: [
        { discount_type: 'new_listing', percent: percents.newListing, enabled: discounts.newListing },
        { discount_type: 'weekly', percent: percents.weekly, enabled: discounts.weekly },
        { discount_type: 'monthly', percent: percents.monthly, enabled: discounts.monthly },
      ],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discounts, percents]);

  const toggle = (k: keyof typeof discounts) =>
    setDiscounts((d) => ({ ...d, [k]: !d[k] }));

  return (
    <WizardShell
      step={11}
      title="Add discounts (optional)"
      subtitle="Discounts help your place get booking faster, optional but useful"
    >
      <div className="max-w-2xl mx-auto">
        <h3 className="text-[13px] font-semibold text-gray-800 mb-4">You can add these discounts</h3>
        
        <div className="space-y-4">
          {/* New Listing Discount */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div className="flex flex-col gap-3">
              <div className="space-y-1">
                <h4 className="text-base font-bold text-gray-900">New listing discount</h4>
                <p className="text-[13px] text-gray-500">Offer 20% off for your first 3 bookings to build reputation.</p>
              </div>
              <div className="flex items-center">
                <div className="flex items-center gap-2 bg-gray-50/50 border border-gray-200 rounded-lg px-3 py-1.5 w-fit">
                  <span className="text-sm font-semibold text-gray-900">{percents.newListing}</span>
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
            </div>
            <Toggle on={discounts.newListing} onClick={() => toggle('newListing')} />
          </div>

          {/* Weekly Discount */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div className="flex flex-col gap-3">
              <div className="space-y-1">
                <h4 className="text-base font-bold text-gray-900">Weekly discount</h4>
                <p className="text-[13px] text-gray-500">7 nights discount to guests</p>
              </div>
              <div className="flex items-center">
                <div className="flex items-center gap-2 bg-gray-50/50 border border-gray-200 rounded-lg px-3 py-1.5 w-fit">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={percents.weekly}
                    onChange={(e) => setPercents(p => ({ ...p, weekly: Number(e.target.value) || 0 }))}
                    className="w-8 bg-transparent text-sm font-semibold text-gray-900 outline-none p-0 border-none focus:ring-0 text-center"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
            </div>
            <Toggle on={discounts.weekly} onClick={() => toggle('weekly')} />
          </div>

          {/* Monthly Discount */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div className="flex flex-col gap-3">
              <div className="space-y-1">
                <h4 className="text-base font-bold text-gray-900">Monthly discount</h4>
                <p className="text-[13px] text-gray-500">28 nights discount to guests</p>
              </div>
              <div className="flex items-center">
                <div className="flex items-center gap-2 bg-gray-50/50 border border-gray-200 rounded-lg px-3 py-1.5 w-fit">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={percents.monthly}
                    onChange={(e) => setPercents(p => ({ ...p, monthly: Number(e.target.value) || 0 }))}
                    className="w-8 bg-transparent text-sm font-semibold text-gray-900 outline-none p-0 border-none focus:ring-0 text-center"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
            </div>
            <Toggle on={discounts.monthly} onClick={() => toggle('monthly')} />
          </div>
        </div>
      </div>
    </WizardShell>
  );
}
