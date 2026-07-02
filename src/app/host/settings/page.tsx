'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Landmark,
  Shield,
  MessageSquareText,
  LifeBuoy,
  Pencil,
  Plus,
  MoreVertical,
  ShieldCheck,
  CheckCircle2,
  type LucideIcon,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import HostDashboardShell, { DashboardHeading } from '../_components/HostDashboardShell';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const NAV: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'payouts', label: 'Payouts & Taxes', icon: Landmark },
  { id: 'security', label: 'Login & Security', icon: Shield },
  { id: 'feedback', label: 'Feedback', icon: MessageSquareText },
  { id: 'support', label: 'Support', icon: LifeBuoy },
];

interface HostProfile {
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
  const [profile, setProfile] = useState<HostProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    about: '',
    language: 'English (US)',
  });

  useEffect(() => {
    if (!userId) return;
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/host/profile-info?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error('Failed to load profile');

      const { data } = await res.json();
      setProfile(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        about: data.about || '',
        language: 'English (US)',
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    try {
      const promises = [];

      // Update about section if changed
      if (formData.about !== profile?.about) {
        promises.push(
          fetch('/api/host/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              about: formData.about,
            }),
          }),
        );
      }

      // Note: Full personal details update would require a separate endpoint
      // For now, we only update the about section via the existing endpoint

      await Promise.all(promises);
      toast.success('Changes saved!');
      await loadProfile();
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
          {tab === 'personal' && profile && (
            <>
              {/* Profile header */}
              <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-200">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative">
                    <img
                      src={profile.avatar}
                      alt={profile.name}
                      className="w-32 h-32 rounded-3xl object-cover ring-4 ring-gray-100 shadow"
                    />
                    <button
                      disabled
                      title="Coming soon"
                      className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-xl shadow-md hover:scale-110 transition-transform opacity-60 cursor-not-allowed"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl font-bold text-gray-800">{profile.name}</h2>
                    <p className="text-sm text-gray-500 mb-4">Hosting since {new Date().getFullYear()}</p>
                    <div className="flex items-center gap-6 justify-center sm:justify-start">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-800">
                          {typeof profile.stats.rating === 'string'
                            ? profile.stats.rating
                            : profile.stats.rating.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Rating</p>
                      </div>
                      <div className="w-px h-10 bg-gray-200" />
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-800">{profile.stats.reviews}</p>
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
                  <Field
                    label="Legal Name"
                    value={formData.name}
                    onChange={(v) => setFormData((prev) => ({ ...prev, name: v }))}
                    type="text"
                  />
                  <Field
                    label="Email Address"
                    value={formData.email}
                    onChange={(v) => setFormData((prev) => ({ ...prev, email: v }))}
                    type="email"
                    disabled
                  />
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-gray-500 ml-1">
                      Bio / Host Description
                    </label>
                    <textarea
                      rows={4}
                      value={formData.about}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, about: e.target.value }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
                      placeholder="Tell guests about yourself..."
                    />
                  </div>
                  <Field
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(v) => setFormData((prev) => ({ ...prev, phone: v }))}
                    type="tel"
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 ml-1">
                      Language Preferences
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, language: e.target.value }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                    >
                      <option>English (US)</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-2"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </>
          )}

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
                  <button className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all">
                    <Plus className="w-4 h-4" /> Add method
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">Chase Bank •••• 8821</p>
                      <p className="text-xs text-gray-500">Default Payout Method • Bank Transfer</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-[11px] rounded-full font-bold uppercase tracking-wider">
                      Active
                    </span>
                    <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
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

function Field({
  label,
  value,
  type,
  disabled = false,
  onChange,
}: {
  label: string;
  value: string;
  type: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-gray-500 ml-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={cn(
          'w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm',
          disabled && 'bg-gray-50 cursor-not-allowed opacity-60',
        )}
      />
    </div>
  );
}
