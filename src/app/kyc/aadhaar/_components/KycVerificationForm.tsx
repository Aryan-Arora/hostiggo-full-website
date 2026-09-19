'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Landmark, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import {
  deferAadhaarKyc,
  formatAadhaarInput,
  isValidAadhaarNumber,
  markAadhaarKycSubmitted,
} from '@/lib/aadhaar';
import { formatPanInput, isValidPanNumber } from '@/lib/pan';

type IdType = 'aadhaar' | 'pan';
type IdResult = { status: 'verified' | 'rejected' | 'pending'; reason: string | null } | null;
type BankResult =
  | { verified: true; accountHolderName: string | null; bankName: string | null }
  | { verified: false; reason: string | null }
  | null;

const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_RE = /^\d{9,18}$/;

function ResultBanner({ result }: { result: IdResult | BankResult }) {
  if (!result) return null;
  const ok = 'verified' in result ? result.verified === true : result.status === 'verified';
  const pending = 'status' in result && result.status === 'pending';
  const reason =
    'reason' in result ? result.reason : null;

  const Icon = ok ? CheckCircle2 : pending ? Clock : XCircle;
  const tone = ok
    ? 'bg-green-50 border-green-200 text-green-800'
    : pending
      ? 'bg-figma-navy/5 border-figma-navy/15 text-gray-700'
      : 'bg-red-50 border-red-200 text-red-700';

  const label = ok
    ? 'accountHolderName' in result && result.accountHolderName
      ? `Verified -- ${result.accountHolderName}${'bankName' in result && result.bankName ? ` (${result.bankName})` : ''}`
      : 'Verified'
    : pending
      ? 'Submitted -- verification in progress.'
      : reason || 'Could not verify. Please check the details and try again.';

  return (
    <div className={cn('flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium', tone)}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{label}</span>
    </div>
  );
}

/**
 * ID + bank verification, shared by the standalone /kyc/aadhaar page and the
 * in-flow KYC modal. Two independent sections, each backed by a direct
 * SurePass call (see src/lib/surepass.ts) -- an id proof (Aadhaar or PAN)
 * and a bank account, mirroring exactly what
 * src/lib/services/hostRouteOnboarding.ts checks for before auto-onboarding
 * a host to Razorpay Route: one verified id proof + one verified bank
 * account. Either section can be submitted on its own; neither blocks the
 * other.
 */
export function KycVerificationForm({
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
  const [idType, setIdType] = useState<IdType>('aadhaar');
  const [fullName, setFullName] = useState(defaultName);
  const [aadhaar, setAadhaar] = useState('');
  const [pan, setPan] = useState('');
  const [consent, setConsent] = useState(false);
  const [idSubmitting, setIdSubmitting] = useState(false);
  const [idResult, setIdResult] = useState<IdResult>(null);

  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankSubmitting, setBankSubmitting] = useState(false);
  const [bankResult, setBankResult] = useState<BankResult>(null);

  useEffect(() => {
    if (defaultName) setFullName((current) => current || defaultName);
  }, [defaultName]);

  const aadhaarDigits = aadhaar.replace(/\s+/g, '');
  const isIdValid =
    idType === 'aadhaar' ? isValidAadhaarNumber(aadhaarDigits) : isValidPanNumber(pan);
  const canSubmitId = fullName.trim().length > 1 && isIdValid && consent && !idSubmitting;

  const isBankValid = ACCOUNT_RE.test(accountNumber) && IFSC_RE.test(ifsc);
  const canSubmitBank = isBankValid && !bankSubmitting;

  // KYC is optional. Deferring is a permanent choice -- the listing flow
  // won't prompt again. The host can come back and finish verification
  // anytime from Host Settings -> Identity Verification, and the dashboard
  // banner keeps nudging them until it's done.
  const handleSkip = () => {
    deferAadhaarKyc(userId);
    onSkipped();
  };

  const handleSubmitId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitId) return;

    setIdSubmitting(true);
    try {
      if (idType === 'aadhaar') {
        const body = await api.verifyAadhaar({ fullName: fullName.trim(), aadhaarNumber: aadhaarDigits });
        const status = body?.status ?? 'pending';
        setIdResult({ status, reason: body?.reason ?? null });
        if (status === 'verified') toast.success('Your Aadhaar has been verified!');
        else if (status === 'rejected') toast.error(body?.reason || 'Aadhaar verification failed.');
        else toast.success('Aadhaar details received -- verification is in progress.');
      } else {
        const body = await api.verifyPan(pan.trim().toUpperCase());
        const status = body?.status ?? 'pending';
        setIdResult({ status, reason: body?.reason ?? null });
        if (status === 'verified') toast.success('Your PAN has been verified!');
        else if (status === 'rejected') toast.error(body?.reason || 'PAN verification failed.');
        else toast.success('PAN details received -- verification is in progress.');
      }
      markAadhaarKycSubmitted(userId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIdSubmitting(false);
    }
  };

  const handleSubmitBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitBank) return;

    setBankSubmitting(true);
    try {
      const body = await api.verifyBank({ accountNumber, ifsc: ifsc.trim().toUpperCase() });
      if (body?.verified) {
        setBankResult({
          verified: true,
          accountHolderName: body.accountHolderName ?? null,
          bankName: body.bankName ?? null,
        });
        toast.success('Your bank account has been verified!');
      } else {
        setBankResult({ verified: false, reason: body?.reason ?? null });
        toast.error(body?.reason || 'Could not verify that bank account.');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBankSubmitting(false);
    }
  };

  // Bank verification is mandatory once id proof is verified -- a hard
  // requirement from the business (payouts need both), not just a UI nudge.
  // So once idVerified flips true, the quick "Done for now" exit disappears
  // until bank is verified too; the host can still bail out entirely via
  // the modal's X (top right), same as before id verification ever ran.
  const idVerified = idResult?.status === 'verified';
  const bankVerified = bankResult?.verified === true;
  const somethingSubmitted = Boolean(idResult || bankResult);
  const canFinish = !idVerified || bankVerified;

  return (
    <div className="space-y-6">
      {/* ID verification */}
      <form onSubmit={handleSubmitId} className="space-y-4">
        <div className="flex rounded-xl bg-gray-100 p-1">
          {(['aadhaar', 'pan'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setIdType(t);
                setIdResult(null);
              }}
              className={cn(
                'flex-1 rounded-lg py-2 text-sm font-semibold transition-all',
                idType === t ? 'bg-white text-figma-navy shadow-sm' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {t === 'aadhaar' ? 'Aadhaar' : 'PAN'}
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="fullName" className="block text-xs font-semibold text-gray-600 mb-1.5">
            Full name (as on {idType === 'aadhaar' ? 'Aadhaar' : 'PAN'})
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

        {idType === 'aadhaar' ? (
          <div>
            <label htmlFor="aadhaar" className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
              <CreditCard className="w-3.5 h-3.5" />
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
            {aadhaarDigits.length === 12 && !isIdValid && (
              <p className="text-xs text-red-500 mt-1.5">That doesn&apos;t look like a valid Aadhaar number.</p>
            )}
          </div>
        ) : (
          <div>
            <label htmlFor="pan" className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              PAN number
            </label>
            <input
              id="pan"
              type="text"
              value={pan}
              onChange={(e) => setPan(formatPanInput(e.target.value))}
              placeholder="ABCDE1234F"
              maxLength={10}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm tracking-widest uppercase outline-none focus:border-figma-navy/40 focus:ring-2 focus:ring-figma-navy/10 transition-all"
            />
            {pan.length === 10 && !isIdValid && (
              <p className="text-xs text-red-500 mt-1.5">That doesn&apos;t look like a valid PAN.</p>
            )}
          </div>
        )}

        <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-figma-navy focus:ring-figma-navy/30"
          />
          <span className="text-xs text-gray-500 leading-relaxed">
            I consent to Hostiggo collecting my {idType === 'aadhaar' ? 'Aadhaar' : 'PAN'} details for
            identity verification, in accordance with the{' '}
            <a href="/privacy" target="_blank" className="text-figma-navy underline">
              Privacy Policy
            </a>
            .
          </span>
        </label>

        <ResultBanner result={idResult} />

        <button
          type="submit"
          disabled={!canSubmitId}
          className="w-full py-3 bg-figma-navy text-white text-sm font-semibold rounded-xl hover:bg-figma-navy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {idSubmitting ? 'Submitting…' : `Verify ${idType === 'aadhaar' ? 'Aadhaar' : 'PAN'}`}
        </button>
      </form>

      <div className="h-px bg-gray-100" />

      {/* Bank verification */}
      <form onSubmit={handleSubmitBank} className="space-y-4">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
          <Landmark className="w-3.5 h-3.5" />
          Bank account verification
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="bankAccount" className="block text-xs font-semibold text-gray-600 mb-1.5">
              Account number
            </label>
            <input
              id="bankAccount"
              type="text"
              inputMode="numeric"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 18))}
              placeholder="219101000000000"
              maxLength={18}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-figma-navy/40 focus:ring-2 focus:ring-figma-navy/10 transition-all"
            />
          </div>
          <div>
            <label htmlFor="bankIfsc" className="block text-xs font-semibold text-gray-600 mb-1.5">
              IFSC code
            </label>
            <input
              id="bankIfsc"
              type="text"
              value={ifsc}
              onChange={(e) => setIfsc(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))}
              placeholder="HDFC0001234"
              maxLength={11}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm uppercase outline-none focus:border-figma-navy/40 focus:ring-2 focus:ring-figma-navy/10 transition-all"
            />
          </div>
        </div>
        <p className="text-[11px] text-gray-400">
          We verify the account is real without moving any money -- no OTP needed.
        </p>

        <ResultBanner result={bankResult} />

        <button
          type="submit"
          disabled={!canSubmitBank}
          className="w-full py-3 bg-figma-navy text-white text-sm font-semibold rounded-xl hover:bg-figma-navy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {bankSubmitting ? 'Verifying…' : 'Verify bank account'}
        </button>
      </form>

      {idVerified && !bankVerified ? (
        <p className="text-center text-xs font-medium text-gray-500">
          Bank verification is required to finish -- your id proof is verified, now add your
          bank details above.
        </p>
      ) : (
        (showSkip || somethingSubmitted) && (
          <button
            type="button"
            onClick={somethingSubmitted && canFinish ? onCompleted : handleSkip}
            className="w-full text-center text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
          >
            {somethingSubmitted && canFinish ? 'Done' : "Skip for now — I'll verify later"}
          </button>
        )
      )}
    </div>
  );
}
