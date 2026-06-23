'use client';

import { useState } from 'react';
import { Bell, Lock, CreditCard, Globe, type LucideIcon } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { cn } from '@/lib/utils';

const NAV: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Lock },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'language', label: 'Language & Region', icon: Globe },
];

const TOGGLES: Record<string, { label: string; desc: string; on: boolean }[]> = {
  notifications: [
    { label: 'Email notifications', desc: 'Booking confirmations, receipts, and reminders', on: true },
    { label: 'SMS alerts', desc: 'Time-sensitive trip updates', on: true },
    { label: 'Promotions & offers', desc: 'Deals, discounts, and Hostiggo news', on: false },
    { label: 'Host messages', desc: 'New messages from your hosts', on: true },
  ],
  privacy: [
    { label: 'Show profile to hosts', desc: 'Let hosts see your public profile before booking', on: true },
    { label: 'Include in search', desc: 'Allow your reviews to appear on listings', on: true },
    { label: 'Activity status', desc: 'Show when you were last active', on: false },
  ],
};

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn('relative w-12 h-7 rounded-full transition-colors shrink-0', on ? 'bg-blue-600' : 'bg-gray-300')}
    >
      <span className={cn('absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform', on && 'translate-x-5')} />
    </button>
  );
}

export default function GuestSettingsPage() {
  const [tab, setTab] = useState('notifications');
  const [state, setState] = useState<Record<string, boolean[]>>({
    notifications: TOGGLES.notifications.map((t) => t.on),
    privacy: TOGGLES.privacy.map((t) => t.on),
  });

  const rows = TOGGLES[tab];

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <Navbar />
      <main className="container-main py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-500">Manage your notifications, privacy, and preferences.</p>
        </div>

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
                  {rows.map((r, i) => (
                    <div key={r.label} className="flex items-center justify-between py-4">
                      <div>
                        <p className="text-sm font-bold text-gray-800">{r.label}</p>
                        <p className="text-xs text-gray-500">{r.desc}</p>
                      </div>
                      <Toggle
                        on={state[tab][i]}
                        onClick={() =>
                          setState((s) => ({
                            ...s,
                            [tab]: s[tab].map((v, idx) => (idx === i ? !v : v)),
                          }))
                        }
                      />
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
      </main>
      <Footer />
    </div>
  );
}
