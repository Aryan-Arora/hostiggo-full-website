'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BadgeCheck,
  MoreVertical,
  CalendarDays,
  Users,
  MapPin,
  MessageSquare,
} from 'lucide-react';
import HostDashboardShell, { DashboardHeading } from '../_components/HostDashboardShell';
import { cn } from '@/lib/utils';

type Booking = {
  id: string;
  guest: string;
  avatar: string;
  dates: string;
  guests: string;
  place: string;
};

const UPCOMING: Booking[] = [
  { id: '1', guest: 'Sarah Mitchell', avatar: 'https://i.pravatar.cc/100?img=5', dates: 'Oct 24 - Oct 28, 2024', guests: '2 Guests', place: 'Blue Horizon Suite, Santorini' },
  { id: '2', guest: 'Mark & Elena', avatar: 'https://i.pravatar.cc/100?img=8', dates: 'Nov 02 - Nov 05, 2024', guests: '2 Guests', place: 'Mountain Echo Lodge' },
  { id: '3', guest: 'David Chen', avatar: 'https://i.pravatar.cc/100?img=15', dates: 'Nov 12 - Nov 15, 2024', guests: '1 Guest', place: 'City Hub Apartment' },
];

const TABS = ['today', 'upcoming', 'past'] as const;
type Tab = (typeof TABS)[number];

export default function BookingsPage() {
  const [tab, setTab] = useState<Tab>('upcoming');

  return (
    <HostDashboardShell active="bookings">
      <DashboardHeading
        title="Bookings"
        subtitle="Manage your property reservations and guest communication."
      />

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-6 py-4 text-sm capitalize border-b-2 -mb-px transition-all',
              tab === t
                ? 'font-bold text-blue-600 border-blue-600'
                : 'font-medium text-gray-500 border-transparent hover:text-blue-600',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'today' ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="h-20 w-20 bg-gray-100 flex items-center justify-center rounded-full mb-4 text-gray-300">
            <CalendarDays className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">
            No reservations for now
          </h3>
          <p className="text-sm text-gray-500">
            Check your upcoming tab for future bookings.
          </p>
        </div>
      ) : tab === 'past' ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="h-20 w-20 bg-gray-100 flex items-center justify-center rounded-full mb-4 text-gray-300">
            <CalendarDays className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">No past stays yet</h3>
          <p className="text-sm text-gray-500">Completed bookings will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {UPCOMING.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card hover:shadow-card-hover transition-all flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={b.avatar}
                    alt={b.guest}
                    className="h-12 w-12 rounded-full object-cover border-2 border-blue-100"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">{b.guest}</h4>
                    <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 px-2 py-0.5 bg-blue-50 rounded-full w-fit mt-0.5">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      Verified
                    </div>
                  </div>
                </div>
                <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 mb-6 flex-grow">
                <div className="flex items-center gap-3 text-gray-500">
                  <CalendarDays className="w-5 h-5" />
                  <span className="text-sm">{b.dates}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-500">
                  <Users className="w-5 h-5" />
                  <span className="text-sm">{b.guests}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-500">
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm truncate">{b.place}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-2">
                <Link
                  href="/host/bookings/details"
                  className="flex-grow py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm text-center transition-all hover:bg-blue-700 active:scale-[0.98]"
                >
                  View Details
                </Link>
                <button className="p-2.5 border border-gray-200 text-blue-600 rounded-xl transition-all hover:bg-blue-50">
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </HostDashboardShell>
  );
}
