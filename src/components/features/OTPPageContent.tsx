'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
const authBg = '/auth-bg.jpg';
import { cn } from '@/lib/utils';
import {
  api,
  AUTH_PHONE_KEY,
  AUTH_USER_ID_KEY,
  AUTH_EMAIL_KEY,
  normalizePhone,
  normalizeEmail,
} from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const OTP_LENGTH = 6;
const RESEND_DELAY = 20;

export default function OTPPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const verifyingRef = useRef(false);

  const mode = (searchParams?.get('mode') as 'phone' | 'email') ?? 'phone';
  const value = searchParams?.get('value') ?? '83183 XXXXX';
  const redirect = searchParams?.get('redirect') || '/';

  const clean = value.replace(/^\+91/, '');
  const maskedValue =
    mode === 'phone'
      ? clean.length >= 10
        ? `+91 ${clean.slice(0, 2)}XXXX${clean.slice(-2)}`
        : `+91 ${clean.slice(0, 1)}XXX${clean.slice(-1)}`
      : value.replace(/(.{2}).*(@.*)/, '$1****$2');

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState(RESEND_DELAY);
  const [canResend, setCanResend] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>(
    Array(OTP_LENGTH).fill(null),
  );

  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0)
      inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1)
      inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH);
    const newOtp = [...otp];
    pasted.split('').forEach((ch, i) => {
      newOtp[i] = ch;
    });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      if (mode === 'email') {
        await api.sendEmailOtp(normalizeEmail(value));
      } else {
        await api.sendOtp(normalizePhone(value));
      }
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimer(RESEND_DELAY);
      setCanResend(false);
      inputRefs.current[0]?.focus();
      toast.success('OTP sent again');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to resend OTP',
      );
    }
  };

  const handleVerify = async () => {
    if (verifyingRef.current) return;
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      inputRefs.current[otp.findIndex((v) => !v)]?.focus();
      return;
    }
    verifyingRef.current = true;
    setVerifying(true);
    try {
      const storedValue = mode === 'email' 
        ? window.localStorage.getItem(AUTH_EMAIL_KEY) || value
        : window.localStorage.getItem(AUTH_PHONE_KEY) || normalizePhone(value);
      
      const verifyParams = mode === 'email'
        ? { email: storedValue, token: code }
        : { phone: storedValue, token: code };

      const data = await api.verifyOtp(verifyParams);
      
      // Check for successful verification - user and/or session should exist
      const userId = data?.user?.id || data?.session?.user?.id;
      const session = data?.session;
      
      if (userId && session) {
        await signIn(userId);
        router.push(redirect || `/onboarding?mode=${mode}`);
      } else {
        // Supabase returned without throwing but didn't give us a real user
        // + session — this used to silently navigate to `redirect` anyway,
        // which could land the visitor on a protected page without ever
        // actually signing them in. Treat it as a failed verification.
        toast.error('Could not verify OTP. Please try again.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid OTP');
    } finally {
      verifyingRef.current = false;
      setVerifying(false);
    }
  };

  const formatTimer = (t: number) => {
    const m = Math.floor(t / 60)
      .toString()
      .padStart(2, '0');
    const s = (t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
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
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="mb-5 p-1 rounded-full hover:bg-gray-100 transition-colors inline-flex"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>

        <h2 className="text-[22px] font-bold text-gray-900 mb-1.5">
          OTP sent successfully
        </h2>
        <p className="text-[13px] text-gray-500 mb-6 leading-relaxed">
          We&apos;ve sent you the code on your{' '}
          {mode === 'phone' ? 'mobile' : 'email'}{' '}
          <span className="font-semibold text-gray-700">{maskedValue}</span>
        </p>

        {/* OTP inputs */}
        <div
          className="flex items-center justify-center gap-1.5 sm:gap-2 mb-3"
          onPaste={handlePaste}
        >
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={cn(
                'w-10 h-10 sm:w-11 sm:h-11 text-center text-base sm:text-[18px] font-bold rounded-full border-2 transition-all outline-none caret-transparent',
                digit
                  ? 'border-[#1B3FA0] bg-[#1B3FA0]/5 text-[#1B3FA0]'
                  : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-[#1B3FA0] focus:bg-white',
              )}
            />
          ))}
        </div>

        {/* Timer / Resend */}
        <div className="text-right mb-6">
          {canResend ? (
            <button
              onClick={handleResend}
              className="text-[13px] font-semibold text-blue-600 hover:underline"
            >
              Resend Code
            </button>
          ) : (
            <span className="text-[13px] text-gray-400">
              resend code after{' '}
              <span className="font-semibold text-orange-500">
                {formatTimer(timer)}
              </span>
            </span>
          )}
        </div>

        {/* Verify button */}
        <button
          onClick={handleVerify}
          disabled={verifying || otp.join('').length !== OTP_LENGTH}
          className={cn(
            'w-full py-3.5 font-semibold rounded-xl transition-all text-[15px] shadow-sm',
            otp.join('').length === OTP_LENGTH
              ? 'bg-[#1B3FA0] hover:bg-[#162e82] active:scale-[0.98] text-white'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed',
          )}
        >
          {verifying ? 'Verifying...' : 'Verify'}
        </button>
      </div>
    </div>
  );
}
