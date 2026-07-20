'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  User,
  Landmark,
  Shield,
  MessageSquareText,
  LifeBuoy,
  Pencil,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import HostDashboardShell, { DashboardHeading } from '../_components/HostDashboardShell';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

const NAV: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'payouts', label: 'Payouts & Taxes', icon: Landmark },
  { id: 'security', label: 'Login & Security', icon: Shield },
  { id: 'feedback', label: 'Feedback', icon: MessageSquareText },
  { id: 'support', label: 'Support', icon: LifeBuoy },
];

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  about: string;
  isVerified: boolean;
  stats: {
    rating: number | string;
    reviews: number;
    listings: number;
  };
}

export default function HostSettingsPage() {
  const { userId } = useAuth();
  const [tab, setTab] = useState('personal');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [about, setAbout] = useState('');
  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
    if (!userId) return;
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/host/profile-info?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error(`Failed to fetch profile: ${res.status}`);
      const json = await res.json();
      setProfile(json.data);
      setName(json.data.name ?? '');
      setEmail(json.data.email ?? '');
      setPhone(json.data.phone ?? '');
      setAbout(json.data.about ?? '');
    } catch (err) {
      console.error('[host/settings] load failed:', err);
      toast.error('Could not load your profile.');
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      await Promise.all([
        api.updateProfile(userId, { name, email, phone }),
        fetch('/api/host/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, about: about.trim() }),
        }).then((res) => {
          if (!res.ok) throw new Error('Failed to save about section');
        }),
      ]);
      toast.success('Profile updated.');
      await loadProfile();
    } catch (err) {
      console.error('[host/settings] save failed:', err);
      toast.error(err instanceof Error ? err.message : 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <HostDashboardShell active="settings">
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </HostDashboardShell>
    );
  }

  return (
    <HostDashboardShell active="settings">
      <DashboardHeading
        title="Account Settings"
        subtitle="Manage your host profile, security preferences, and financial information."
      />

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings nav */}
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
                      'flex items-center justify-between px-4 py-3 rounded-xl transition-all text-sm',
                      on
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-gray-500 hover:bg-gray-100',
                    )}
                  >
                    <span>{n.label}</span>
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {tab === 'personal' && (loadingProfile ? (
            <div className="bg-white rounded-2xl p-16 shadow-card border border-gray-200 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Profile header */}
              <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-200">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative">
                    <img
                      src={profile?.avatar || 'https://i.pravatar.cc/200?img=45'}
                      alt={profile?.name || 'Host'}
                      className="w-32 h-32 rounded-3xl object-cover ring-4 ring-gray-100 shadow"
                    />
                    <button
                      disabled
                      title="Photo upload coming soon"
                      className="absolute -bottom-2 -right-2 bg-blue-600/70 text-white p-2 rounded-xl shadow-md cursor-not-allowed"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl font-bold text-gray-800">{profile?.name}</h2>
                    <p className="text-sm text-gray-500 mb-4">Hosting since {new Date().getFullYear()}</p>
                    <div className="flex items-center gap-6 justify-center sm:justify-start">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-800">
                          {typeof profile?.stats.rating === 'string'
                            ? profile.stats.rating
                            : profile?.stats.rating?.toFixed(1) ?? 'N/A'}
                        </p>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Rating</p>
                      </div>
                      <div className="w-px h-10 bg-gray-200" />
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-800">{profile?.stats.reviews ?? 0}</p>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Reviews</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 ml-1">Legal Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 ml-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-gray-500 ml-1">
                      Bio / Host Description
                    </label>
                    <textarea
                      rows={4}
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                      placeholder="Tell guests a bit about yourself as a host."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 ml-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </>
          ))}

          {tab === 'payouts' && (
            <>
              <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Payout Methods</h3>
                    <p className="text-sm text-gray-500">
                      Manage how you receive your hosting earnings.
                    </p>
                  </div>
                  <button
                    disabled
                    title="Coming soon"
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-400 rounded-xl font-bold cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" /> Add method
                  </button>
                </div>
                <div className="p-8 rounded-xl border border-dashed border-gray-200 text-center">
                  <Landmark className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No payout method on file yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Payout management is coming soon.</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-800">Identity Verification</h3>
                    <p className="text-sm text-gray-500">
                      Your identity has been {profile?.isVerified ? 'successfully verified' : 'not yet verified'}.
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    'flex items-center gap-2 font-bold',
                    profile?.isVerified ? 'text-green-600' : 'text-gray-400',
                  )}
                >
                  <CheckCircle2 className="w-5 h-5" /> {profile?.isVerified ? 'Verified' : 'Pending'}
                </span>
              </div>
            </>
          )}

          {(tab === 'security' || tab === 'feedback' || tab === 'support') && (
            <div className="bg-white rounded-2xl p-10 shadow-card border border-gray-200 text-center">
              <p className="text-gray-500">
                {NAV.find((n) => n.id === tab)?.label} settings coming soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </HostDashboardShell>
  );
}
