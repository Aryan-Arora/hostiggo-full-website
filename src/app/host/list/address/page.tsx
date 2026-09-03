'use client';

import { ShieldCheck } from 'lucide-react';
import WizardShell from '../_components/WizardShell';
import { useListingDraft } from '@/context/ListingDraftContext';

export default function AddressPage() {
  const { draft, update } = useListingDraft();

  const handleUpdate = (field: string, value: string) => {
    update({ [field]: value });
  };

  const isComplete =
    draft.country &&
    draft.addressLine1 &&
    draft.city &&
    draft.state &&
    draft.postalCode;

  return (
    <WizardShell
      step={4}
      title="Confirm Address"
      subtitle="This will help us to locate your homestay accurately"
      nextDisabled={!isComplete}
    >
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">
              Country / Region
            </label>
            <select
              value={draft.country || 'India'}
              onChange={(e) => handleUpdate('country', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-figma-navy focus:border-transparent outline-none text-sm appearance-none"
            >
              <option value="India">India</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">
              Street address
            </label>
            <input
              type="text"
              placeholder="Street address"
              value={draft.addressLine1 || ''}
              onChange={(e) => handleUpdate('addressLine1', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-figma-navy focus:border-transparent outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">
              Nearby Landmark (Optional)
            </label>
            <input
              type="text"
              placeholder="Nearby Landmark (Optional)"
              value={draft.landmark || ''}
              onChange={(e) => handleUpdate('landmark', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-figma-navy focus:border-transparent outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">
              City / Town
            </label>
            <input
              type="text"
              placeholder="City / Town"
              value={draft.city || ''}
              onChange={(e) => handleUpdate('city', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-figma-navy focus:border-transparent outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">
                State / UT
              </label>
              <select
                value={draft.state || ''}
                onChange={(e) => handleUpdate('state', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-figma-navy focus:border-transparent outline-none text-sm appearance-none"
              >
                <option value="" disabled>Select State</option>
                <option value="Delhi">Delhi</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Gujarat">Gujarat</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">
                Postal Code
              </label>
              <input
                type="text"
                placeholder="Postal Code"
                value={draft.postalCode || ''}
                onChange={(e) => handleUpdate('postalCode', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-figma-navy focus:border-transparent outline-none text-sm"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3 p-4 bg-green-50/50 border border-green-100 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-green-900 mb-0.5">
                Your Privacy Matters
              </p>
              <p className="text-xs text-green-800 leading-relaxed">
                We only use your address to show an approximate location to guests.
                Your exact address is shared only after a booking is confirmed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </WizardShell>
  );
}
