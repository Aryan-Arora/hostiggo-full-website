'use client';

import { MapPin, Pin, Pencil, ShieldCheck, Plus, Minus, LocateFixed } from 'lucide-react';
import WizardShell from '../_components/WizardShell';
import { useListingDraft } from '@/context/ListingDraftContext';

export default function LocationPage() {
  const { draft, update } = useListingDraft();
  return (
    <WizardShell
      step={2}
      title="Where is your property located?"
      subtitle="Your address is only shared with guests after they’ve made a reservation."
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left: search + pin details */}
        <div className="md:col-span-4 flex flex-col gap-4 order-2 md:order-1">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-card transition-all hover:border-blue-300">
            <label
              htmlFor="address-search"
              className="text-xs font-semibold text-gray-500 block mb-2 px-1 uppercase tracking-wider"
            >
              Search address
            </label>
            <div className="relative">
              <MapPin className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="address-search"
                type="text"
                defaultValue={draft.addressLine1 ?? ''}
                onChange={(e) => update({ addressLine1: e.target.value })}
                placeholder="Enter your property address"
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>

          {/* Selected location preview */}
          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <Pin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-blue-600">Pin picked</h3>
                <p className="text-sm font-medium text-gray-800">
                  Block H, Connaught Place
                </p>
                <p className="text-sm text-gray-500">
                  New Delhi, Delhi 110001, India
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <button
                disabled
                title="Coming soon"
                className="text-sm font-medium text-gray-400 flex items-center gap-1.5 cursor-not-allowed"
              >
                <Pencil className="w-4 h-4" />
                Adjust pin location
              </button>
            </div>
          </div>

          {/* Privacy note */}
          <div className="flex gap-3 p-4 bg-white rounded-2xl border border-dashed border-gray-300">
            <ShieldCheck className="w-5 h-5 text-gray-400 shrink-0" />
            <p className="text-xs text-gray-500 leading-relaxed">
              We only use your address to show an approximate location to guests.
              Your exact address is shared only after a booking is confirmed.
            </p>
          </div>
        </div>

        {/* Right: map */}
        <div className="md:col-span-8 order-1 md:order-2">
          <div className="relative w-full rounded-2xl overflow-hidden shadow-card border border-gray-200 bg-gray-100">
            <div
              className="relative h-[480px] md:h-[600px] cursor-default bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&h=900&fit=crop&q=80')",
              }}
            >
              {/* Zoom controls (interactive map coming soon) */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <button
                  disabled
                  title="Coming soon"
                  className="w-10 h-10 bg-white/70 rounded-lg flex items-center justify-center shadow-md cursor-not-allowed opacity-60"
                >
                  <Plus className="w-5 h-5 text-gray-500" />
                </button>
                <button
                  disabled
                  title="Coming soon"
                  className="w-10 h-10 bg-white/70 rounded-lg flex items-center justify-center shadow-md cursor-not-allowed opacity-60"
                >
                  <Minus className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              {/* Center pin */}
              <MapPin className="w-10 h-10 text-red-500 fill-red-500 drop-shadow-lg absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full" />
              {/* Use current location */}
              <button
                disabled
                title="Coming soon"
                className="absolute bottom-6 right-6 bg-white/80 px-5 py-3 rounded-full flex items-center gap-2 shadow-lg text-sm font-medium text-gray-400 cursor-not-allowed"
              >
                <LocateFixed className="w-5 h-5" />
                Use current location
              </button>
              {/* Hint */}
              <div className="absolute bottom-6 left-6 px-4 py-2 rounded-lg border border-white/40 shadow-sm flex items-center gap-2 bg-white/70 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs font-medium text-gray-700">
                  Map preview
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WizardShell>
  );
}
