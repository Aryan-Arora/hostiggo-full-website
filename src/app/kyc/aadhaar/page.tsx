'use client';

import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import {
  formatAadhaarInput,
  hasSubmittedAadhaarKyc,
  isValidAadhaarNumber,
  markAadhaarKycSubmitted,
  skipAadhaarKycThisAttempt,
} from '@/lib/aadhaar';

const authBg = '/auth-bg.jpg';

function AadhaarKycContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId, user, loading: authLoading } = useAuth();
  const redirect = searchParams?.get('redirect') || '/';

  const [fullName, setFullName] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.name) setFullName(user.name);
  }, [user?.name]);

  // Not signed in, or this browser already has a submission on file for
  // this user -- nothing to do here, move on.
  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      router.replace(`/signin?redirect=${encodeURIComponent(`/kyc/aadhaar?redirect=${redirect}`)}`);
      return;
    }
    if (hasSubmittedAadhaarKyc(userId)) {
      router.replace(redirect);
    }
  }, [authLoading, userId, redirect, router]);

  const digitsOnly = aadhaar.replace(/\s+/g, '');
  const isValid = isValidAadhaarNumber(digitsOnly);
  const canSubmit = fullName.trim().length > 1 && isValid && consent && !submitting;

  // Doesn't mark KYC as submitted -- just lets this one listing attempt
  // through. The gate re-applies the next time they start a new listing.
  const handleSkip = () => {
    if (!userId) return;
    skipAadhaarKycThisAttempt(userId);
    router.push(redirect);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !canSubmit) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/kyc/aadhaar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, fullName: fullName.trim(), aadhaarNumber: digitsOnly }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not submit your details. Please try again.');
      }
      markAadhaarKycSubmitted(userId);
      toast.success('Aadhaar details received -- verification is in progress.');
      router.push(redirect);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden py-10">
      <Image fill priority src={authBg} alt="background" sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

      <div className="absolute top-6 left-8 z-10 flex items-center gap-2">
        <div className="w-8 h-8 bg-[#004772] rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-[16px]">H</span>
        </div>
        <span className="font-black text-white text-[16px] tracking-wider uppercase drop-shadow">
          HOSTI<span className="text-figma-accent">GO</span>
        </span>
      </div>

      <div className="relative z-10 w-full max-w-[420px] mx-4 bg-white rounded-3xl shadow-2xl p-8">
        <div className="w-12 h-12 rounded-2xl bg-figma-navy/10 text-figma-navy flex items-center justify-center mb-5">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1.5">Verify your identity</h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          To keep bookings safe for everyone, we ask every host to submit their
          Aadhaar details once before listing a property. This is a one-time
          step -- we&apos;ll use it only for identity verification.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-xs font-semibold text-gray-600 mb-1.5">
              Full name (as on Aadhaar)
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-figma-navy/40 focus:ring-2 focus:ring-figma-navy/10 transition-all"
            />
          </div>

          <div>
            <label htmlFor="aadhaar" className="block text-xs font-semibold text-gray-600 mb-1.5">
              Aadhaar number
            </label>
            <input
              id="aadhaar"
              type="text"
              inputMode="numeric"
              value={aadhaar}
              onChange={(e) => setAadhaar(formatAadhaarInput(e.target.value))}
              placeholder="XXXX XXXX XXXX"
              maxLength={14}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm tracking-widest outline-none focus:border-figma-navy/40 focus:ring-2 focus:ring-figma-navy/10 transition-all"
            />
            {digitsOnly.length === 12 && !isValid && (
              <p className="text-xs text-red-500 mt-1.5">That doesn&apos;t look like a valid Aadhaar number.</p>
            )}
          </div>

          <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-figma-navy focus:ring-figma-navy/30"
            />
            <span className="text-xs text-gray-500 leading-relaxed">
              I consent to Hostiggo collecting my Aadhaar details for identity
              verification, in accordance with the{' '}
              <a href="/privacy" target="_blank" className="text-figma-navy underline">
                Privacy Policy
              </a>
              .
            </span>
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3 bg-figma-navy text-white text-sm font-semibold rounded-xl hover:bg-figma-navy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all mt-2"
          >
            {submitting ? 'Submitting…' : 'Submit for verification'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleSkip}
          className="w-full text-center text-xs font-semibold text-gray-500 hover:text-gray-700 mt-4 transition-colors"
        >
          Do KYC verification later
        </button>
      </div>
    </div>
  );
}

function AadhaarKycFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-10 h-10 border-2 border-figma-navy/30 border-t-figma-navy rounded-full animate-spin" />
    </div>
  );
}

export default function AadhaarKycPage() {
  return (
    <Suspense fallback={<AadhaarKycFallback />}>
      <AadhaarKycContent />
    </Suspense>
  );
}
