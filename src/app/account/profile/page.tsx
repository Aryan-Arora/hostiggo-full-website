'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ChevronRight, Camera, ShieldCheck, Mail, Phone, Loader2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

export default function GuestProfilePage() {
  const { user, userId, loading, isAuthenticated, refresh } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Seed the form from the real user once it loads.
  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setEmail(user.email ?? '');
      setPhone(user.phone ?? '');
      setAge(user.age ? String(user.age) : '');
      setEmergencyContact(user.emergency_contact ?? '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      await api.updateProfile(userId, { 
        name, 
        email, 
        phone,
        age: age ? parseInt(age, 10) : null,
        emergency_contact: emergencyContact || null,
      });
      await refresh();
      toast.success('Profile updated.');
    } catch (err) {
      console.error('[account/profile] save failed:', err);
      toast.error(err instanceof Error ? err.message : 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const avatar = user?.profile_pic_url || 'https://i.pravatar.cc/200?img=45';

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !userId) return;
    setUploadingPhoto(true);
    try {
      const url = await api.uploadProfilePhoto(file);
      await api.updateProfile(userId, { profile_pic_url: url });
      await refresh();
      toast.success('Profile photo updated.');
    } catch (err) {
      console.error('[account/profile] photo upload failed:', err);
      toast.error(err instanceof Error ? err.message : 'Could not upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <Navbar />
      <main className="container-main py-8">
        <nav className="flex items-center gap-2 py-4 text-gray-500 text-sm">
          <span>Account</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-blue-600 font-bold">Profile</span>
        </nav>

        {loading ? (
          <div className="py-24 flex justify-center text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : !isAuthenticated ? (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-card py-16 text-center max-w-md mx-auto">
            <p className="text-4xl mb-3">🔒</p>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Sign in to view your profile</h2>
            <p className="text-sm text-gray-500 mb-6">Manage your personal details once you&apos;re signed in.</p>
            <Link
              href="/signin?redirect=/account/profile"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700"
            >
              Sign in
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Summary */}
            <aside className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl p-8 shadow-card border border-gray-200">
                <div className="flex flex-col items-center text-center">
                  <div className="relative w-32 h-32 mb-6">
                    <img
                      src={avatar}
                      alt={name || 'Profile'}
                      className="w-full h-full rounded-full object-cover border-4 border-blue-100 shadow-lg"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      title="Change photo"
                      className="absolute bottom-1 right-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      {uploadingPhoto ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <h1 className="text-xl font-bold text-gray-900 mb-1">{name || 'Your name'}</h1>
                  <p className="text-sm text-gray-500 mb-4">{email || phone || 'Hostiggo member'}</p>
                </div>
              </div>

              {user?.is_verified && (
                <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-200 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Identity verified</p>
                    <p className="text-xs text-gray-500">Your account is verified</p>
                  </div>
                </div>
              )}
            </aside>

            {/* Details */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 mb-6">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 ml-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 ml-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 ml-1">Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 ml-1">Age</label>
                    <input
                      type="number"
                      min="1"
                      max="150"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-gray-500 ml-1">Emergency Contact</label>
                    <input
                      type="text"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="Name and phone number (optional)"
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

              <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 mb-6">Contact Preferences</h2>
                <div className="space-y-4">
                  {[
                    { icon: Mail, label: 'Email notifications', desc: 'Booking updates and offers' },
                    { icon: Phone, label: 'SMS alerts', desc: 'Time-sensitive trip reminders' },
                  ].map((p) => {
                    const Icon = p.icon;
                    return (
                      <div
                        key={p.label}
                        className="flex items-center justify-between p-4 rounded-xl border border-gray-200"
                      >
                        <div className="flex items-center gap-4">
                          <Icon className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-bold text-gray-800">{p.label}</p>
                            <p className="text-xs text-gray-500">{p.desc}</p>
                          </div>
                        </div>
                        <Link href="/account/settings" className="text-sm text-blue-600 font-bold hover:underline">
                          Manage
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
