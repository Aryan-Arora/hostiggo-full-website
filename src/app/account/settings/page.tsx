'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Bell, Lock, CreditCard, Globe, Loader2, type LucideIcon } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

const NAV: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Lock },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'language', label: 'Language & Region', icon: Globe },
];

type PrefKey =
  | 'email_notifications'
  | 'sms_alerts'
  | 'promo_notifications'
  | 'host_message_notifications'
  | 'show_profile_to_hosts'
  | 'include_in_search'
  | 'activity_status';

const ROWS: Record<'notifications' | 'privacy', { key: PrefKey; label: string; desc: string }[]> = {
  notifications: [
    { key: 'email_notifications', label: 'Email notifications', desc: 'Booking confirmations, receipts, and reminders' },
    { key: 'sms_alerts', label: 'SMS alerts', desc: 'Time-sensitive trip updates' },
    { key: 'promo_notifications', label: 'Promotions & offers', desc: 'Deals, discounts, and Hostiggo news' },
    { key: 'host_message_notifications', label: 'Host messages', desc: 'New messages from your hosts' },
  ],
  privacy: [
    { key: 'show_profile_to_hosts', label: 'Show profile to hosts', desc: 'Let hosts see your public profile before booking' },
    { key: 'include_in_search', label: 'Include in search', desc: 'Allow your reviews to appear on listings' },
    { key: 'activity_status', label: 'Activity status', desc: 'Show when you were last active' },
  ],
};

// Payment and Language & Region have no backing data anywhere in the
// schema (no saved-payment-methods table, no locale/currency preference
// column) -- shown honestly as "coming soon" rather than fake toggles.

function Toggle({
  on,
  onToggle,
  saving,
}: {
  on: boolean;
  onToggle: () => void;
  saving: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={saving}
      aria-pressed={on}
      className={cn(
        'relative w-12 h-7 rounded-full transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed',
        on ? 'bg-blue-600' : 'bg-gray-300',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform',
          on ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

export default function GuestSettingsPage() {
  const [tab, setTab] = useState<'notifications' | 'privacy' | 'payment' | 'language'>('notifications');
  const { user, userId, isAuthenticated, loading: authLoading, refresh } = useAuth();

  const [prefs, setPrefs] = useState<Partial<Record<PrefKey, boolean>>>({});
  const [savingKey, setSavingKey] = useState<PrefKey | null>(null);

  useEffect(() => {
    if (!user) return;
    setPrefs({
      email_notifications: user.email_notifications ?? true,
      sms_alerts: user.sms_alerts ?? true,
      promo_notifications: user.promo_notifications ?? false,
      host_message_notifications: user.host_message_notifications ?? true,
      show_profile_to_hosts: user.show_profile_to_hosts ?? true,
      include_in_search: user.include_in_search ?? true,
      activity_status: user.activity_status ?? true,
    });
  }, [user]);

  const handleToggle = async (key: PrefKey) => {
    if (!userId || savingKey) return;
    const next = !prefs[key];
    setPrefs((p) => ({ ...p, [key]: next }));
    setSavingKey(key);
    try {
      await api.updateProfile(userId, { [key]: next });
      await refresh();
    } catch (err) {
      console.error('[account/settings] toggle failed:', err);
      setPrefs((p) => ({ ...p, [key]: !next }));
      toast.error(err instanceof Error ? err.message : 'Could not save that preference.');
    } finally {
      setSavingKey(null);
    }
  };

  const rows = tab === 'notifications' || tab === 'privacy' ? ROWS[tab] : null;

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
                      onClick={() => setTab(n.id as typeof tab)}
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
                    <div key={r.key} className="flex items-center justify-between py-4">
                      <div>
                        <p className="text-sm font-bold text-gray-800">{r.label}</p>
                        <p className="text-xs text-gray-500">{r.desc}</p>
                      </div>
                      <Toggle
                        on={!!prefs[r.key]}
                        onToggle={() => handleToggle(r.key)}
                        saving={savingKey === r.key}
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
        )}
      </main>
      <Footer />
    </div>
  );
}
