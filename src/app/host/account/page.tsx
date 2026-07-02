'use client';

import Link from 'next/link';
import { Pencil, Star, Home, CalendarCheck, ShieldCheck, ChevronRight, type LucideIcon, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import HostDashboardShell, { DashboardHeading } from '../_components/HostDashboardShell';

const QUICK: { icon: LucideIcon; label: string; href: string }[] = [
  { icon: Home, label: 'My listings', href: '/host/listings' },
  { icon: CalendarCheck, label: 'Reservations', href: '/host/bookings' },
  { icon: ShieldCheck, label: 'Account & security', href: '/host/settings' },
];

type ProfileData = {
  name: string;
  email?: string;
  phone?: string;
  avatar: string;
  about: string;
  isVerified: boolean;
  stats: {
    rating: number | string;
    reviews: number;
    listings: number;
  };
};

export default function HostAccountPage() {
  const { userId } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingAbout, setEditingAbout] = useState(false);
  const [aboutText, setAboutText] = useState('');
  const [savingAbout, setSavingAbout] = useState(false);

  const loadProfile = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/host/profile-info?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error(`Failed to fetch profile: ${res.status}`);
      
      const json = await res.json();
      setProfile(json.data);
      setAboutText(json.data.about || '');
    } catch (err) {
      console.error('[host/account] Failed to load profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const handleSaveAbout = async () => {
    if (!userId) return;
    
    setSavingAbout(true);
    try {
      const res = await fetch('/api/host/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          about: aboutText.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to save about section');
      
      toast.success('About section updated!');
      setEditingAbout(false);
      await loadProfile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSavingAbout(false);
    }
  };

  if (loading) {
    return (
      <HostDashboardShell active="settings">
        <div className="py-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </HostDashboardShell>
    );
  }

  if (error || !profile) {
    return (
      <HostDashboardShell active="settings">
        <div className="bg-white rounded-3xl p-8 shadow-card border border-gray-200 text-center">
          <p className="text-red-500 font-bold">{error || 'Failed to load profile'}</p>
        </div>
      </HostDashboardShell>
    );
  }

  const stats = [
    { label: 'Rating', value: profile.stats.rating },
    { label: 'Reviews', value: profile.stats.reviews },
    { label: 'Listings', value: profile.stats.listings },
  ];

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
                src={profile.avatar}
                alt={profile.name}
                className="w-full h-full rounded-3xl object-cover ring-4 ring-gray-100 shadow"
              />
              <button className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-xl shadow-md hover:scale-110 transition-transform" disabled title="Photo upload coming soon">
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-xl font-bold text-gray-800">{profile.name}</h2>
            {profile.isVerified && (
              <div className="flex items-center gap-1 text-sm font-bold text-blue-600 mb-6">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Verified Host
              </div>
            )}
            <div className="w-full grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100 pt-6">
              {stats.map((s) => (
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
          {/* About section */}
          <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">About</h3>
              {!editingAbout && (
                <button
                  onClick={() => setEditingAbout(true)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit about section"
                >
                  <Pencil className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>

            {editingAbout ? (
              <div className="space-y-3">
                <textarea
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                  placeholder="Tell guests about yourself, your hosting style, and what makes your place special..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
                  rows={5}
                />
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setEditingAbout(false);
                      setAboutText(profile.about);
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAbout}
                    disabled={savingAbout}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {savingAbout && <Loader2 className="w-4 h-4 animate-spin" />}
                    {savingAbout ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 leading-relaxed min-h-[80px]">
                {aboutText || <span className="text-gray-400 italic">No about section yet. Click the pen icon to add one!</span>}
              </p>
            )}
          </div>

          {/* Contact info */}
          <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Contact Info</h3>
            <div className="space-y-3 text-sm">
              {profile.email && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Email</p>
                  <p className="text-gray-800 font-medium">{profile.email}</p>
                </div>
              )}
              {profile.phone && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Phone</p>
                  <p className="text-gray-800 font-medium">{profile.phone}</p>
                </div>
              )}
              {!profile.email && !profile.phone && (
                <p className="text-gray-500 text-sm">No contact info on file</p>
              )}
            </div>
          </div>

          {/* Quick links */}
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
