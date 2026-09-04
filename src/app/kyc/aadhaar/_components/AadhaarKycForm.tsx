'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, CreditCard, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  deferAadhaarKyc,
  formatAadhaarInput,
  isValidAadhaarNumber,
  markAadhaarKycSubmitted,
} from '@/lib/aadhaar';

type Side = 'front' | 'back';
type UploadState = { path: string | null; previewUrl: string | null; uploading: boolean };

const emptyUpload = (): UploadState => ({ path: null, previewUrl: null, uploading: false });

// One upload tile, sized to an ID-card aspect ratio (like every real Aadhaar/
// KYC verification flow) so it visually reads as "photograph the card here"
// rather than a generic file picker.
function DocumentUploadTile({
  label,
  state,
  onSelect,
  onRemove,
}: {
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

/**
 * The Aadhaar KYC form itself -- no page chrome, no routing. Shared by the
 * standalone /kyc/aadhaar page and the in-flow KYC modal. All of the
 * submit / skip bookkeeping (localStorage flags, API calls, toasts) lives
 * here; callers just react to onCompleted / onSkipped.
 */
export function AadhaarKycForm({
  userId,
  defaultName = '',
  onCompleted,
  onSkipped,
  showSkip = true,
}: {
  userId: string;
  defaultName?: string;
  onCompleted: () => void;
  onSkipped: () => void;
  showSkip?: boolean;
}) {
  const [fullName, setFullName] = useState(defaultName);
  const [aadhaar, setAadhaar] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [front, setFront] = useState<UploadState>(emptyUpload());
  const [back, setBack] = useState<UploadState>(emptyUpload());

  useEffect(() => {
    if (defaultName) setFullName((current) => current || defaultName);
  }, [defaultName]);

  const uploadSide = async (side: Side, file: File) => {
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

  // KYC is optional. Deferring is a permanent choice -- the listing flow
  // won't prompt again. The host can come back and finish verification
  // anytime from Host Settings -> Identity Verification, and the dashboard
  // banner keeps nudging them until it's done.
  const handleSkip = () => {
    deferAadhaarKyc(userId);
    onSkipped();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

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
      onCompleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2.5">
          <CreditCard className="w-3.5 h-3.5" />
          Photo of your Aadhaar card
        </p>
        <div className="grid grid-cols-2 gap-3">
          <DocumentUploadTile
            label="Front side"
            state={front}
            onSelect={(f) => uploadSide('front', f)}
            onRemove={() => setFront(emptyUpload())}
          />
          <DocumentUploadTile
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
          <p className="text-xs text-red-500 mt-1.5">
            That doesn&apos;t look like a valid Aadhaar number.
          </p>
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
          I consent to Hostiggo collecting my Aadhaar photo and details for identity
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

      {showSkip && (
        <button
          type="button"
          onClick={handleSkip}
          className="w-full text-center text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
        >
          Skip for now — I&apos;ll verify later
        </button>
      )}
    </form>
  );
}
