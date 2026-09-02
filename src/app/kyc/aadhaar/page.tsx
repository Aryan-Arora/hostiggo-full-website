'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Camera, CreditCard, Loader2, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
  formatAadhaarInput,
  hasSubmittedAadhaarKyc,
  isValidAadhaarNumber,
  markAadhaarKycSubmitted,
  skipAadhaarKycThisAttempt,
} from '@/lib/aadhaar';

const authBg = '/auth-bg.jpg';

type Side = 'front' | 'back';
type UploadState = { path: string | null; previewUrl: string | null; uploading: boolean };

const emptyUpload = (): UploadState => ({ path: null, previewUrl: null, uploading: false });

// One upload tile, sized to an ID-card aspect ratio (like every real Aadhaar/
// KYC verification flow) so it visually reads as "photograph the card here"
// rather than a generic file picker.
function DocumentUploadTile({
  side,
  label,
  state,
  onSelect,
  onRemove,
}: {
  side: Side;
  label: string;
  state: UploadState;
  onSelect: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p className="text-xs font-semibold text-gray-600 mb-1.5">{label}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          if (inputRef.current) inputRef.current.value = '';
        }}
      />
      <div
        onClick={() => !state.uploading && !state.previewUrl && inputRef.current?.click()}
        className={cn(
          'relative aspect-[85.6/54] rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all',
          state.previewUrl
            ? 'border-transparent'
            : 'border-gray-300 bg-gray-50 hover:border-figma-navy/50 hover:bg-figma-navy/5 cursor-pointer',
        )}
      >
        {state.uploading ? (
          <Loader2 className="w-6 h-6 text-figma-navy animate-spin" />
        ) : state.previewUrl ? (
          <>
            <Image
              src={state.previewUrl}
              alt={`${label} preview`}
              fill
              sizes="260px"
              className="object-cover"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              aria-label={`Remove ${label.toLowerCase()}`}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            <Camera className="w-6 h-6 text-gray-400 mb-1.5" />
            <span className="text-[11px] font-medium text-gray-500">Tap to upload</span>
          </>
        )}
      </div>
    </div>
  );
}

function AadhaarKycContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId, user, loading: authLoading } = useAuth();
  const redirect = searchParams?.get('redirect') || '/';

  const [fullName, setFullName] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [front, setFront] = useState<UploadState>(emptyUpload());
  const [back, setBack] = useState<UploadState>(emptyUpload());

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

  const uploadSide = async (side: Side, file: File) => {
    if (!userId) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error('That photo is too large (max 8MB).');
      return;
    }
    const setState = side === 'front' ? setFront : setBack;
    setState((s) => ({ ...s, uploading: true }));
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('userId', userId);
      form.append('side', side);
      const res = await fetch('/api/kyc/aadhaar/upload', { method: 'POST', body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Upload failed');
      setState({ path: body.data.path, previewUrl: body.data.previewUrl ?? null, uploading: false });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not upload that photo');
      setState((s) => ({ ...s, uploading: false }));
    }
  };

  const digitsOnly = aadhaar.replace(/\s+/g, '');
  const isValid = isValidAadhaarNumber(digitsOnly);
  const canSubmit =
    fullName.trim().length > 1 &&
    isValid &&
    consent &&
    !!front.path &&
    !!back.path &&
    !submitting;

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
        body: JSON.stringify({
          userId,
          fullName: fullName.trim(),
          aadhaarNumber: digitsOnly,
          frontImagePath: front.path,
          backImagePath: back.path,
        }),
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

      <div className="relative z-10 w-full max-w-[480px] mx-4 bg-white rounded-3xl shadow-2xl p-8">
        <div className="w-12 h-12 rounded-2xl bg-figma-navy/10 text-figma-navy flex items-center justify-center mb-5">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1.5">Verify your identity</h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          To keep bookings safe for everyone, we ask every host to upload a
          photo of their Aadhaar card once before listing a property. This is
          a one-time step -- we&apos;ll use it only for identity verification.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2.5">
              <CreditCard className="w-3.5 h-3.5" />
              Photo of your Aadhaar card
            </p>
            <div className="grid grid-cols-2 gap-3">
              <DocumentUploadTile
                side="front"
                label="Front side"
                state={front}
                onSelect={(f) => uploadSide('front', f)}
                onRemove={() => setFront(emptyUpload())}
              />
              <DocumentUploadTile
                side="back"
                label="Back side"
                state={back}
                onSelect={(f) => uploadSide('back', f)}
                onRemove={() => setBack(emptyUpload())}
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              Make sure all four corners are visible and the details are readable.
            </p>
          </div>

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
              I consent to Hostiggo collecting my Aadhaar photo and details for
              identity verification, in accordance with the{' '}
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
