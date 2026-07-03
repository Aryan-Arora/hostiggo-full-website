'use client';

import { useState, useRef, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Phone, ChevronDown, ArrowLeft, Compass } from 'lucide-react';
const authBg = '/auth-bg.jpg';
import { cn } from '@/lib/utils';
import { api, AUTH_PHONE_KEY, AUTH_EMAIL_KEY, normalizePhone, normalizeEmail } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type Mode = 'phone' | 'email';

function SignInContent() {
  const [mode, setMode] = useState<Mode>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || '';

  const errorParam = searchParams?.get('error');

  useEffect(() => {
    if (!errorParam) return;
    toast.error(errorParam === 'access_denied' ? 'Google sign-in was cancelled.' : `Sign-in error. Please try again.`);
  }, [errorParam]);

  const handleSkip = () => router.push(redirect || '/');

  const handleSendOTP = async () => {
    if (sendingRef.current) return;
    if (mode === 'phone' && phone.trim().length < 10) return;
    if (mode === 'email' && !email.includes('@')) return;

    sendingRef.current = true;
    setSending(true);
    try {
      if (mode === 'email') {
        const normalizedEmail = normalizeEmail(email);
        await api.sendEmailOtp(normalizedEmail);
        window.localStorage.setItem(AUTH_EMAIL_KEY, normalizedEmail);
        router.push(
          `/otp?mode=email&value=${encodeURIComponent(normalizedEmail)}${
            redirect ? `&redirect=${encodeURIComponent(redirect)}` : ''
          }`,
        );
      } else {
        const normalizedPhone = normalizePhone(phone);
        await api.sendOtp(normalizedPhone);
        window.localStorage.setItem(AUTH_PHONE_KEY, normalizedPhone);
        router.push(
          `/otp?mode=phone&value=${encodeURIComponent(normalizedPhone)}${
            redirect ? `&redirect=${encodeURIComponent(redirect)}` : ''
          }`,
        );
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to send OTP';
      if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('over') || msg.toLowerCase().includes('too many')) {
        toast.error('Please wait 60 seconds before requesting a new code');
      } else {
        toast.error(msg);
      }
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo: `${window.location.origin}/auth/callback${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) {
        toast.error('Google sign-in failed. Please try again.');
      }
    } catch (err) {
      toast.error('Google sign-in failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <img
        src={authBg}
        alt="background"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

      {/* Logo */}
      <div className="absolute top-6 left-8 z-10 flex items-center gap-2">
        <div className="w-8 h-8 bg-[#004772] rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-[16px]">H</span>
        </div>
        <span className="font-black text-white text-[16px] tracking-wider uppercase drop-shadow">
          HOSTI<span className="text-sky-300">GO</span>
        </span>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[360px] mx-4 bg-white rounded-3xl shadow-2xl p-8">
        {/* Back arrow on email mode */}
        {mode === 'email' && (
          <button
            onClick={() => setMode('phone')}
            className="mb-4 p-1 rounded-full hover:bg-gray-100 transition-colors inline-flex"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
        )}

        <h2 className="text-[22px] font-bold text-gray-900 mb-1">
          {mode === 'phone' ? 'Sign in with mobile no.' : 'Sign in with email'}
        </h2>
        <p className="text-[13px] text-gray-500 mb-6">
          Sign in to access personalized travel plans made for you
        </p>

        {/* Phone input */}
        {mode === 'phone' && (
          <div className="flex items-center gap-0 border border-gray-200 rounded-xl overflow-hidden mb-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
            <div className="flex items-center gap-1 px-3 py-3 bg-gray-50 border-r border-gray-200 text-[14px] font-medium text-gray-700 cursor-pointer select-none">
              <span>+91</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <input
              type="tel"
              placeholder="Enter Mobile No."
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
              }
              className="flex-1 px-4 py-3 text-[14px] text-gray-800 outline-none bg-white placeholder:text-gray-400"
            />
          </div>
        )}

        {/* Email input */}
        {mode === 'email' && (
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl overflow-hidden mb-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
            <Mail className="w-4 h-4 text-gray-400 ml-4 flex-shrink-0" />
            <input
              type="email"
              placeholder="Enter email id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-2 py-3 text-[14px] text-gray-800 outline-none bg-white placeholder:text-gray-400"
            />
          </div>
        )}

        {/* Send OTP button */}
        <button
          onClick={handleSendOTP}
          disabled={sending}
          className="w-full py-3.5 bg-[#1B3FA0] hover:bg-[#162e82] active:scale-[0.98] text-white font-semibold rounded-xl transition-all text-[15px] shadow-sm mb-5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#1B3FA0] disabled:active:scale-100"
        >
          {sending ? 'Sending...' : 'Send OTP'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[12px] text-gray-400 font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Social buttons */}
        <div className="flex items-center justify-center gap-5 mb-6">
          {mode === 'phone' ? (
            <>
              {/* Google */}
              <button
                onClick={handleGoogleSignIn}
                className="w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md"
              >
                <GoogleIcon />
              </button>
              {/* Apple */}
              <button
                disabled
                title="Coming soon"
                className="w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center shadow-sm opacity-50 cursor-not-allowed"
              >
                <AppleIcon />
              </button>
            </>
          ) : (
            <>
              {/* Phone login */}
              <button
                onClick={() => setMode('phone')}
                className="w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Phone className="w-5 h-5 text-blue-600" />
              </button>
              {/* Apple */}
              <button
                disabled
                title="Coming soon"
                className="w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center shadow-sm opacity-50 cursor-not-allowed"
              >
                <AppleIcon />
              </button>
            </>
          )}
        </div>

        {/* Switch mode */}
        {mode === 'phone' && (
          <p className="text-center text-[13px] text-gray-500 mb-4">
            <button
              onClick={() => setMode('email')}
              className="text-blue-600 hover:underline font-medium"
            >
              Sign in with email instead
            </button>
          </p>
        )}

        {/* Skip / browse as guest */}
        <button
          onClick={handleSkip}
          className="w-full flex items-center justify-center gap-2 py-3 mb-4 rounded-xl border border-gray-200 text-gray-600 font-medium text-[14px] hover:bg-gray-50 transition-all"
        >
          <Compass className="w-4 h-4" />
          Skip for now — browse properties
        </button>

        {/* Terms */}
        <p className="text-center text-[11px] text-gray-400 leading-relaxed">
          By continuing, you agree to Hostiggo's{' '}
          <a href="/terms" className="text-blue-500 hover:underline">
            Terms and Conditions
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-blue-500 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
      <SignInContent />
    </Suspense>
  );
}

function GoogleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-gray-800"
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}
