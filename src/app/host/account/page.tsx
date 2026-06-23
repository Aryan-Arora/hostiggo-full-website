'use client';

import Link from 'next/link';
import { Pencil, Star, Home, CalendarCheck, ShieldCheck, ChevronRight, type LucideIcon } from 'lucide-react';
import HostDashboardShell, { DashboardHeading } from '../_components/HostDashboardShell';

const STATS: { label: string; value: string }[] = [
  { label: 'Rating', value: '4.9' },
  { label: 'Reviews', value: '128' },
  { label: 'Listings', value: '4' },
];

const QUICK: { icon: LucideIcon; label: string; href: string }[] = [
  { icon: Home, label: 'My listings', href: '/host/listings' },
  { icon: CalendarCheck, label: 'Reservations', href: '/host/bookings' },
  { icon: ShieldCheck, label: 'Account & security', href: '/host/settings' },
];

export default function HostAccountPage() {
  return (
    <HostDashboardShell active="settings">
      <DashboardHeading
        title="Host Profile"
        subtitle="Your public profile and quick links to manage your hosting account."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile card */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-8 shadow-card border border-gray-200">
          <div className="flex flex-col items-center text-center">
            <div className="relative w-32 h-32 mb-6">
              <img
                src="https://i.pravatar.cc/200?img=12"
                alt="Daniel Hart"
                className="w-full h-full rounded-3xl object-cover ring-4 ring-gray-100 shadow"
              />
              <button className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-xl shadow-md hover:scale-110 transition-transform">
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Daniel Hart</h2>
            <p className="text-sm text-gray-500 mb-1">Hosting since 2019</p>
            <div className="flex items-center gap-1 text-sm font-bold text-blue-600 mb-6">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Superhost
            </div>
            <div className="w-full grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100 pt-6">
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-lg font-bold text-gray-800">{s.value}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick links + about */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">About</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Passionate about creating memorable stays. I love architecture, local coffee
              shops, and ensuring every guest feels at home. Available 24/7 for my guests.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-2 shadow-card border border-gray-200">
            {QUICK.map((q) => {
              const Icon = q.icon;
              return (
                <Link
                  key={q.label}
                  href={q.href}
                  className="flex items-center justify-between px-4 py-4 rounded-2xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{q.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </HostDashboardShell>
  );
}
