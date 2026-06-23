'use client';

import { useState } from 'react';
import {
  Download,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Lightbulb,
  CheckCircle2,
  Ban,
  Info,
} from 'lucide-react';
import HostDashboardShell from '../_components/HostDashboardShell';
import { cn } from '@/lib/utils';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// October 2024 starts on a Tuesday → 2 leading blanks.
const LEADING = 2;
const priceFor = (d: number) => ([4, 5, 11, 12, 18, 19, 25, 26].includes(d) ? 165 : 140);

export default function CalendarPage() {
  const [open, setOpen] = useState(true);
  const selected = [7, 8];

  return (
    <HostDashboardShell active="calendar">
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Calendar */}
        <div className="flex-1 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">October 2024</h2>
              <p className="text-sm text-gray-500">
                Update your availability and nightly rates.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-all">
                <Download className="w-4 h-4" />
                Import iCal
              </button>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button className="p-2 bg-white shadow-sm rounded-md text-blue-600">
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500">
                  <List className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button className="p-2 hover:bg-gray-50 transition-all">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-px h-8 bg-gray-200" />
                <button className="p-2 hover:bg-gray-50 transition-all">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
              {DOW.map((d) => (
                <div key={d} className="py-3 text-center text-sm font-medium text-gray-500">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: LEADING }).map((_, i) => (
                <div key={`b${i}`} className="aspect-square bg-gray-50/50 border-r border-b border-gray-100" />
              ))}
              {Array.from({ length: 31 }).map((_, i) => {
                const day = i + 1;
                const sel = selected.includes(day);
                return (
                  <div
                    key={day}
                    className={cn(
                      'aspect-square p-3 border-r border-b border-gray-100 cursor-pointer flex flex-col transition-colors relative',
                      sel ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50',
                    )}
                  >
                    <span
                      className={cn(
                        'text-sm',
                        sel ? 'text-blue-700 font-bold' : 'text-gray-500',
                      )}
                    >
                      {day}
                    </span>
                    <div className="mt-auto text-blue-600 font-bold text-xs">
                      ${priceFor(day)}
                    </div>
                    {sel && (
                      <div className="absolute inset-0 border-2 border-blue-500 rounded-sm pointer-events-none" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Details panel */}
        <aside className="w-full xl:w-96 shrink-0">
          <div className="sticky top-24 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Selection Details</h3>

              <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 mb-1">
                  <CalendarDays className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-bold text-gray-800">Oct 7 – Oct 8, 2024</span>
                </div>
                <p className="text-xs text-gray-500 ml-8">2 nights selected</p>
              </div>

              <div className="space-y-4 mb-8">
                <label className="block text-sm text-gray-500">Nightly Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-500">$</span>
                  <input
                    type="text"
                    defaultValue="140"
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg outline-none"
                  />
                </div>
                <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 flex gap-3">
                  <Lightbulb className="w-5 h-5 text-blue-600 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-blue-700">Smart Pricing Tip</p>
                    <p className="text-xs text-gray-600 leading-snug">
                      Demand is 12% higher for these dates. Increase price to{' '}
                      <strong className="text-blue-700">$155</strong> to earn more.
                    </p>
                    <button className="mt-1 text-xs font-bold text-blue-700 underline">
                      Apply suggestion
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <label className="block text-sm text-gray-500">Availability</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setOpen(true)}
                    className={cn(
                      'flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold transition-all',
                      open
                        ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                        : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50',
                    )}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Open
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold transition-all',
                      !open
                        ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                        : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50',
                    )}
                  >
                    <Ban className="w-4 h-4" />
                    Block
                  </button>
                </div>
              </div>

              <button className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md active:scale-95 transition-all">
                Save Changes
              </button>
              <button className="w-full mt-3 py-2 text-gray-500 text-sm hover:underline">
                Clear Selection
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <Info className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-gray-800">Tips for Hosts</h4>
              </div>
              <ul className="space-y-3 text-sm text-gray-500 list-disc pl-5">
                <li>Open more dates to increase your visibility in search.</li>
                <li>Weekend rates can be 15–20% higher than weekdays.</li>
                <li>Sync your iCal to avoid double bookings.</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </HostDashboardShell>
  );
}
