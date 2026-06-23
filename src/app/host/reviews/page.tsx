'use client';

import { useState } from 'react';
import { Share2, Star, Search, Reply, Flag } from 'lucide-react';
import HostDashboardShell, { DashboardHeading } from '../_components/HostDashboardShell';
import { cn } from '@/lib/utils';

const DIST = [
  { label: '5 stars', pct: 85 },
  { label: '4 stars', pct: 10 },
  { label: '3 stars', pct: 3 },
  { label: '2 stars', pct: 1 },
  { label: '1 star', pct: 1 },
];

const REVIEWS = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    avatar: 'https://i.pravatar.cc/100?img=5',
    stay: 'Jan 2024',
    place: 'Skyline View Penthouse',
    rating: 5,
    ago: '2 days ago',
    text: 'Absolutely loved our stay here. The view of the skyline at night is unmatched. The host was incredibly responsive and the apartment was pristine upon arrival. We especially appreciated the local guidebook provided.',
  },
  {
    id: '2',
    name: 'David Chen',
    avatar: 'https://i.pravatar.cc/100?img=15',
    stay: 'Dec 2023',
    place: 'Urban Minimalist Loft',
    rating: 4,
    ago: '3 weeks ago',
    text: 'Great location and a very clean, well-designed space. Check-in was seamless. Only minor note was the street noise at night, but the provided earplugs were a thoughtful touch.',
  },
];

const TABS = ['All Reviews', 'Recent first', 'Highest ratings', 'Lowest ratings'];

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'w-4 h-4',
            i < n ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200',
          )}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [tab, setTab] = useState(TABS[0]);

  return (
    <HostDashboardShell active="reviews">
      <DashboardHeading
        title="Guest Feedback"
        subtitle="Monitor and respond to your guests' property reviews."
        actions={
          <button className="flex items-center gap-2 bg-white border border-gray-200 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
            <Share2 className="w-5 h-5" />
            Export
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-4 bg-white rounded-3xl p-8 shadow-card border border-gray-200 flex flex-col items-center justify-center text-center">
          <p className="text-xs text-gray-500 uppercase tracking-[0.2em] mb-4">
            Overall Rating
          </p>
          <h2 className="text-6xl font-bold text-gray-900 leading-none mb-3">4.8</h2>
          <Stars n={5} />
          <p className="text-sm text-gray-500 mt-3">Based on 124 reviews</p>
        </div>
        <div className="lg:col-span-8 bg-white rounded-3xl p-8 shadow-card border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-[0.2em] mb-6">
            Rating Distribution
          </p>
          <div className="space-y-4">
            {DIST.map((d) => (
              <div key={d.label} className="flex items-center gap-4">
                <span className="text-sm text-gray-800 w-12 text-right">{d.label}</span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${d.pct}%` }} />
                </div>
                <span className="text-sm text-gray-500 w-10">{d.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-gray-200 pb-4 mb-6">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-5 py-2 rounded-xl text-sm whitespace-nowrap transition-all',
                tab === t
                  ? 'bg-white shadow-sm font-bold text-blue-600'
                  : 'font-medium text-gray-500 hover:bg-gray-200',
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or content"
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {REVIEWS.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-3xl p-6 md:p-8 shadow-card border border-gray-100"
          >
            <div className="flex flex-col md:flex-row gap-6">
              <img
                src={r.avatar}
                alt={r.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-gray-100 flex-shrink-0"
              />
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{r.name}</h3>
                    <p className="text-sm text-gray-500">
                      Stayed: {r.stay} •{' '}
                      <span className="font-semibold text-blue-600">{r.place}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <Stars n={r.rating} />
                    <span className="text-xs text-gray-400 mt-1">{r.ago}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{r.text}</p>
                <div className="flex items-center gap-4 pt-2">
                  <button className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline">
                    <Reply className="w-4 h-4" />
                    Reply to Guest
                  </button>
                  <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors text-sm">
                    <Flag className="w-4 h-4" />
                    Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </HostDashboardShell>
  );
}
