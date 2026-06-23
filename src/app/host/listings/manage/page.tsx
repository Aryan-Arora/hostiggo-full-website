'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Bath, BedDouble, Minus, Plus, Info, PlusCircle, Trash2 } from 'lucide-react';
import HostDashboardShell from '../../_components/HostDashboardShell';

const CAP = [
  { key: 'guests', label: 'Max Guests', icon: Users, initial: 4 },
  { key: 'bathrooms', label: 'Bathrooms', icon: Bath, initial: 2 },
  { key: 'beds', label: 'Total Beds', icon: BedDouble, initial: 3 },
] as const;

const BED_TYPES = ['Single Bed', 'Twin Bed', 'Double Bed', 'Queen Bed', 'King Bed', 'Sofa Bed', 'Futon'];

export default function ManageListingPage() {
  const [counts, setCounts] = useState<Record<string, number>>(
    Object.fromEntries(CAP.map((c) => [c.key, c.initial])),
  );
  const [bedrooms, setBedrooms] = useState([
    { id: 1, type: 'Queen Bed' },
    { id: 2, type: 'Twin Bed' },
  ]);

  const set = (k: string, d: number) =>
    setCounts((c) => ({ ...c, [k]: Math.max(0, c[k] + d) }));

  return (
    <HostDashboardShell active="listings">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/host/listings"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-blue-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Listing</h1>
            <p className="text-sm text-gray-500">Update your room details and guest capacity</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-6 py-2.5 text-blue-600 border border-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all">
            Edit
          </button>
          <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 active:scale-[0.98] transition-all">
            Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Capacity */}
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Capacity</h3>
            <div className="space-y-6">
              {CAP.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-base font-semibold text-gray-800">{c.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => set(c.key, -1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-blue-600 transition-colors text-gray-600"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-lg font-bold w-6 text-center">{counts[c.key]}</span>
                      <button
                        onClick={() => set(c.key, 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-blue-600 transition-colors text-gray-600"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-blue-50/60 rounded-3xl p-6 border border-blue-100">
            <div className="flex items-start gap-4">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-blue-700 mb-1">Host Tip</p>
                <p className="text-sm text-gray-600">
                  Listings with precise room details tend to get 25% more bookings.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bedrooms */}
        <section className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">Bedroom Configuration</h3>
            <button
              onClick={() =>
                setBedrooms((b) => [...b, { id: Date.now(), type: 'Queen Bed' }])
              }
              className="flex items-center gap-2 text-blue-600 font-bold hover:underline"
            >
              <PlusCircle className="w-5 h-5" />
              <span className="text-sm">Add Bedroom</span>
            </button>
          </div>

          <div className="space-y-6">
            {bedrooms.map((bed, i) => (
              <div
                key={bed.id}
                className="bg-white rounded-3xl p-6 shadow-card border border-gray-200 relative group overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 opacity-50" />
                <div className="flex flex-col md:flex-row gap-6">
                  <img
                    src={`https://images.unsplash.com/photo-150569341638${i % 2 === 0 ? '8' : '9'}-ac5ce068fe85?w=200&h=200&fit=crop&q=80`}
                    alt={`Bedroom ${i + 1}`}
                    className="w-24 h-24 rounded-2xl object-cover shadow-md shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base font-bold text-gray-800">Bedroom {i + 1}</h4>
                      {bedrooms.length > 1 && (
                        <button
                          onClick={() => setBedrooms((b) => b.filter((x) => x.id !== bed.id))}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                        Bed Type
                      </label>
                      <div className="relative">
                        <BedDouble className="w-5 h-5 text-blue-600 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          value={bed.type}
                          onChange={(e) =>
                            setBedrooms((b) =>
                              b.map((x) => (x.id === bed.id ? { ...x, type: e.target.value } : x)),
                            )
                          }
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold appearance-none"
                        >
                          {BED_TYPES.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </HostDashboardShell>
  );
}
