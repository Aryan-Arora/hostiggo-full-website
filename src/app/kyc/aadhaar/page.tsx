'use client';

import { Suspense, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { hasSubmittedAadhaarKyc } from '@/lib/aadhaar';
import { AadhaarKycForm } from './_components/AadhaarKycForm';

const authBg = '/auth-bg.jpg';

function AadhaarKycContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId, user, loading: authLoading } = useAuth();
  const redirect = searchParams?.get('redirect') || '/';

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

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden py-10">
      <Image fill priority src={authBg} alt="background" sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

      <div className="absolute top-6 left-8 z-10 flex items-center gap-2">
        <div className="w-8 h-8 bg-[#004772] rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-[16px]">H</span>
        </div>
        <span className="font-black text-white text-[16px] tracking-wider uppercase drop-shadow">
          HOSTI<span className="text-figma-accent">GGO</span>
        </span>
      </div>

      <div className="relative z-10 w-full max-w-[480px] mx-4 bg-white rounded-3xl shadow-2xl p-8">
        <div className="w-12 h-12 rounded-2xl bg-figma-navy/10 text-figma-navy flex items-center justify-center mb-5">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1.5">Verify your identity</h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Verified hosts earn more guest trust and bookings. It&apos;s optional and takes a
          minute -- upload a photo of your Aadhaar card once. You can also do this later from
          Settings. We use it only for identity verification.
        </p>

        {userId && (
          <AadhaarKycForm
            userId={userId}
            defaultName={user?.name ?? ''}
            onCompleted={() => router.push(redirect)}
            onSkipped={() => router.push(redirect)}
          />
        )}
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
