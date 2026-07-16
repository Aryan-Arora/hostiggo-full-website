'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, Lock, CreditCard, Globe, Loader2, type LucideIcon } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const NAV: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Lock },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'language', label: 'Language & Region', icon: Globe },
];

// None of these preferences have a real column/table backing them yet — no
// notification-preference or privacy-flag fields exist anywhere in the
// schema — so every row is shown disabled with "Coming soon" rather than a
// toggle that looks interactive but silently doesn't save anything.
const TOGGLES: Record<string, { label: string; desc: string }[]> = {
  notifications: [
    { label: 'Email notifications', desc: 'Booking confirmations, receipts, and reminders' },
    { label: 'SMS alerts', desc: 'Time-sensitive trip updates' },
    { label: 'Promotions & offers', desc: 'Deals, discounts, and Hostiggo news' },
    { label: 'Host messages', desc: 'New messages from your hosts' },
  ],
  privacy: [
    { label: 'Show profile to hosts', desc: 'Let hosts see your public profile before booking' },
    { label: 'Include in search', desc: 'Allow your reviews to appear on listings' },
    { label: 'Activity status', desc: 'Show when you were last active' },
  ],
};

function Toggle({ disabled }: { disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      title={disabled ? 'Coming soon' : undefined}
      className={cn(
        'relative w-12 h-7 rounded-full transition-colors shrink-0',
        disabled ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-300',
      )}
    >
      <span className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow" />
    </button>
  );
}

export default function GuestSettingsPage() {
  const [tab, setTab] = useState('notifications');
  const { isAuthenticated, loading: authLoading } = useAuth();

  const rows = TOGGLES[tab];

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <Navbar />
      <main className="container-main py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-500">Manage your notifications, privacy, and preferences.</p>
        </div>

        {authLoading ? (
          <div className="py-24 flex justify-center text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : !isAuthenticated ? (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-card py-16 text-center max-w-md mx-auto">
            <p className="text-4xl mb-3">🔒</p>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Sign in to view your settings</h2>
            <p className="text-sm text-gray-500 mb-6">Manage your preferences once you&apos;re signed in.</p>
            <Link
              href="/signin?redirect=/account/settings"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700"
            >
              Sign in
            </Link>
          </div>
        ) : (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-2xl p-2 shadow-card border border-gray-200">
              <nav className="flex flex-col space-y-1">
                {NAV.map((n) => {
                  const Icon = n.icon;
                  const on = tab === n.id;
                  return (
                    <button
                      key={n.id}
                      onClick={() => setTab(n.id)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm',
                        on ? 'bg-blue-600 text-white font-semibold' : 'text-gray-500 hover:bg-gray-100',
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {n.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 mb-6">
                {NAV.find((n) => n.id === tab)?.label}
              </h2>
              {rows ? (
                <div className="divide-y divide-gray-100">
                  {rows.map((r) => (
                    <div key={r.label} className="flex items-center justify-between py-4">
                      <div>
                        <p className="text-sm font-bold text-gray-800">{r.label}</p>
                        <p className="text-xs text-gray-500">{r.desc}</p>
                      </div>
                      <Toggle disabled />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 py-6 text-center">
                  {NAV.find((n) => n.id === tab)?.label} settings coming soon.
                </p>
              )}
            </div>
          </div>
        </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
