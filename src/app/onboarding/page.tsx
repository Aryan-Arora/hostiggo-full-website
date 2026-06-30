'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
const authBg = '/auth-bg.jpg';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams?.get('mode') || 'phone';
  const { user, userId, isAuthenticated, loading: authLoading, refresh } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<string>('');
  const [emergencyContact, setEmergencyContact] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !userId) {
      router.push('/signin');
      return;
    }
    if (user?.name) setName(user.name);
    if (user?.email) setEmail(user.email);
    if (user?.phone) setPhone(user.phone);
    if (user?.age) setAge(user.age?.toString() || '');
    if (user?.emergency_contact) setEmergencyContact(user.emergency_contact);
  }, [user, userId, isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-[#1B3FA0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const needsEmail = mode === 'phone';
  const needsPhone = mode === 'email';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
      if (!trimmed) return;
    if (needsEmail && !email.includes('@')) return;
    if (!age.trim()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          name: trimmed,
          email: email || user?.email || '',
          phone: phone || user?.phone || null,
          age: age ? parseInt(age) : null,
          emergency_contact: emergencyContact || null,
          is_verified: true,
          is_active: true,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');

      await refresh();
      toast.success('Welcome to Hostiggo!');
      router.push('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden">
      <img src={authBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

      <div className="relative z-10 w-full max-w-[360px] mx-4 bg-white rounded-3xl shadow-2xl p-8">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-8 h-8 bg-[#004772] rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-[16px]">H</span>
          </div>
          <span className="font-black text-gray-800 text-[16px] tracking-wider uppercase">
            HOSTI<span className="text-sky-300">GO</span>
          </span>
        </div>

        <h2 className="text-[22px] font-bold text-gray-900 mb-1 text-center">
          Welcome!
        </h2>
        <p className="text-[13px] text-gray-500 mb-6 text-center">
          Tell us about yourself
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Your name
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full px-4 py-3 text-[14px] text-gray-800 rounded-xl border border-gray-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-gray-400"
            />
          </div>

          {needsEmail && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Email address
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-[14px] text-gray-800 rounded-xl border border-gray-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-gray-400"
              />
            </div>
          )}

          {needsPhone && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Phone number <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 text-[14px] text-gray-800 rounded-xl border border-gray-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-gray-400"
              />
            </div>
          )}

          {age === '' && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="Enter your age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-3 text-[14px] text-gray-800 rounded-xl border border-gray-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-gray-400"
              />
            </div>
          )}

          {emergencyContact === '' && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Emergency Contact <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="Enter emergency contact"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full px-4 py-3 text-[14px] text-gray-800 rounded-xl border border-gray-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-gray-400"
              />
            </div>
          )}

          {age !== '' && age !== null && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-400 mb-1.5 block">
                Age
              </label>
              <input
                type="text"
                placeholder="Your age"
                value={age}
                disabled
                className="w-full px-4 py-3 text-[14px] text-gray-500 rounded-xl border border-gray-200 bg-gray-50 cursor-not-allowed placeholder:text-gray-400"
              />
            </div>
          )}

          {emergencyContact !== '' && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-400 mb-1.5 block">
                Emergency Contact
              </label>
              <input
                type="text"
                placeholder="Emergency contact"
                value={emergencyContact}
                disabled
                className="w-full px-4 py-3 text-[14px] text-gray-500 rounded-xl border border-gray-200 bg-gray-50 cursor-not-allowed placeholder:text-gray-400"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !name.trim() || (needsEmail && !email.includes('@'))}
            className="w-full py-3.5 bg-[#1B3FA0] hover:bg-[#162e82] active:scale-[0.98] text-white font-semibold rounded-xl transition-all text-[15px] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Get Started'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#1B3FA0] border-t-transparent rounded-full animate-spin" /></div>}>
      <OnboardingContent />
    </Suspense>
  );
}
