'use client';

import Link from 'next/link';
import {
  ChevronRight,
  Printer,
  BadgeCheck,
  Star,
  MessageSquare,
  Phone,
  Check,
  Hourglass,
  CalendarX,
  CalendarDays,
  Building2,
  ExternalLink,
  Utensils,
  Car,
} from 'lucide-react';
import HostDashboardShell from '../../_components/HostDashboardShell';
import { cn } from '@/lib/utils';

const TIMELINE = [
  { label: 'Payment', date: 'Oct 12, 2023', icon: Check, state: 'done' },
  { label: 'Check-in', date: 'Nov 04, 15:00', icon: Check, state: 'done' },
  { label: 'Staying', date: 'Now', icon: Hourglass, state: 'active' },
  { label: 'Check-out', date: 'Nov 11, 11:00', icon: CalendarX, state: 'future' },
] as const;

const ADDONS = [
  { icon: Utensils, title: 'Daily Breakfast', sub: 'All guests • 7 days', price: '$140' },
  { icon: Car, title: 'Rent A Car', sub: 'SUV • Full coverage', price: '$450' },
];

export default function BookingDetailsPage() {
  return (
    <HostDashboardShell active="bookings">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Link href="/host/bookings" className="hover:text-blue-600">
              Reservations
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-600">Booking #HG-882190</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Booking Details</h1>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all flex items-center gap-2">
            <Printer className="w-5 h-5" /> Print
          </button>
          <button className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700 transition-all">
            Approve Stay
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left */}
        <div className="lg:col-span-8 space-y-6">
          {/* Guest overview */}
          <section className="bg-white rounded-2xl p-6 shadow-card border border-gray-200">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="relative">
                <img
                  src="https://i.pravatar.cc/200?img=32"
                  alt="Elena Rodriguez"
                  className="w-32 h-32 rounded-3xl object-cover shadow ring-4 ring-gray-100"
                />
                <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-full border-4 border-white">
                  <BadgeCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Elena Rodriguez</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-400">Guest since 2021</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <span className="flex items-center gap-1 text-sm font-bold text-blue-600">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> 4.9 (12)
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-gray-100 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
                    ID Verified
                  </span>
                </div>
                <p className="text-sm text-gray-500 max-w-xl mb-6 italic">
                  &quot;Looking forward to staying at your beautiful villa! Traveling with my
                  partner for our anniversary. We&apos;re very quiet and respectful guests.&quot;
                </p>
                <div className="flex flex-wrap gap-3">
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">
                    <MessageSquare className="w-5 h-5" /> Contact Guest
                  </button>
                  <button className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all">
                    <Phone className="w-5 h-5" /> Call Elena
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="bg-white rounded-2xl p-6 shadow-card border border-gray-200">
            <h3 className="text-lg font-bold text-blue-600 mb-8">Booking Timeline</h3>
            <div className="relative flex flex-col md:flex-row justify-between gap-8">
              <div className="hidden md:block absolute top-4 left-0 w-full h-0.5 bg-gray-200 z-0" />
              <div className="hidden md:block absolute top-4 left-0 w-1/2 h-0.5 bg-blue-600 z-0" />
              {TIMELINE.map((t) => {
                const Icon = t.icon;
                return (
                  <div
                    key={t.label}
                    className={cn(
                      'relative z-10 flex md:flex-col items-start md:items-center gap-4 md:gap-2 flex-1',
                      t.state === 'future' && 'opacity-40',
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center shadow-md',
                        t.state === 'future'
                          ? 'bg-gray-200 text-gray-500'
                          : 'bg-blue-600 text-white',
                        t.state === 'active' && 'animate-pulse',
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="md:text-center">
                      <p
                        className={cn(
                          'text-sm font-bold',
                          t.state === 'active' ? 'text-blue-600' : 'text-gray-800',
                        )}
                      >
                        {t.label}
                      </p>
                      <p className="text-xs text-gray-400">{t.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Stay + property */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white rounded-2xl p-6 shadow-card border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <CalendarDays className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-gray-800">Stay Dates</h3>
              </div>
              <div className="space-y-1">
                {[
                  ['Duration', '7 Nights'],
                  ['Check-in', 'Nov 4, 2023'],
                  ['Check-out', 'Nov 11, 2023'],
                ].map(([k, v], i) => (
                  <div
                    key={k}
                    className={cn(
                      'flex justify-between items-center py-2',
                      i < 2 && 'border-b border-gray-100',
                    )}
                  >
                    <span className="text-sm text-gray-400">{k}</span>
                    <span className="text-sm font-bold text-gray-800">{v}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 shadow-card border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-gray-800">Property</h3>
              </div>
              <div className="flex gap-4 items-center mb-6">
                <img
                  src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=200&h=200&fit=crop&q=80"
                  alt="Ocean Breeze Villa"
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                />
                <div>
                  <p className="text-sm font-bold text-gray-800">Ocean Breeze Villa</p>
                  <p className="text-xs text-gray-400">Full Villa • 3 Bedrooms</p>
                </div>
              </div>
              <Link
                href="/host/listings/manage"
                className="bg-gray-50 p-4 rounded-xl flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <span className="text-xs font-bold text-blue-600">MANAGE LISTING</span>
                <ExternalLink className="w-4 h-4 text-blue-600" />
              </Link>
            </section>
          </div>

          {/* Add-ons */}
          <section className="bg-white rounded-2xl p-6 shadow-card border border-gray-200">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-blue-600">Selected Add-ons</h3>
              <button className="text-sm font-bold text-blue-600 hover:underline">
                + Add Extras
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ADDONS.map((a) => {
                const Icon = a.icon;
                return (
                  <div
                    key={a.title}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-blue-200 bg-blue-50/40"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-bold text-gray-800">{a.title}</p>
                      <p className="text-xs text-gray-400">{a.sub}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-800">{a.price}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right: payment summary */}
        <aside className="lg:col-span-4">
          <div className="sticky top-24 bg-white rounded-2xl p-6 shadow-card border border-gray-200">
            <h3 className="text-lg font-bold text-blue-600 mb-6">Payment Summary</h3>
            <div className="space-y-4 mb-6">
              {[
                ['$250.00 x 7 nights', '$1,750.00'],
                ['Add-ons', '$590.00'],
                ['Cleaning fee', '$80.00'],
                ['Service fee', '$120.00'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium text-gray-800">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-200 mb-6">
              <span className="font-bold text-gray-800">Total payout</span>
              <span className="text-xl font-bold text-blue-600">$2,540.00</span>
            </div>
            <Link
              href="/host/bookings/cancel"
              className="block w-full text-center py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
            >
              Cancel Booking
            </Link>
          </div>
        </aside>
      </div>
    </HostDashboardShell>
  );
}
