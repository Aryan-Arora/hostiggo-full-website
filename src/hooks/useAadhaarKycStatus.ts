'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  hasDeferredAadhaarKyc,
  hasSubmittedAadhaarKyc,
  markAadhaarKycSubmitted,
} from '@/lib/aadhaar';

export type AadhaarKycStatus = 'none' | 'pending' | 'verified' | 'rejected' | 'unknown';

export interface AadhaarKycState {
  /** Server-authoritative status, with a local-flag fallback when the API is unreachable. */
  status: AadhaarKycStatus;
  /** Last 4 digits of the submitted Aadhaar number, for display. */
  last4: string | null;
  /** ISO timestamp of the submission, if any. */
  submittedAt: string | null;
  /** The host chose "verify later" -- KYC is optional, so we honor this. */
  deferred: boolean;
  loading: boolean;
  /** Re-fetch (e.g. after a submission). */
  refresh: () => void;
}

/**
 * Resolves a user's Aadhaar KYC state from GET /api/kyc/aadhaar, falling back
 * to the per-browser localStorage flags in src/lib/aadhaar.ts when the API
 * can't be reached. Used by the host dashboard banner and Settings.
 */
export function useAadhaarKycStatus(): AadhaarKycState {
  const { userId } = useAuth();
  const [status, setStatus] = useState<AadhaarKycStatus>('unknown');
  const [last4, setLast4] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [deferred, setDeferred] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!userId) {
      setStatus('unknown');
      setDeferred(false);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setDeferred(hasDeferredAadhaarKyc(userId));

    fetch(`/api/kyc/aadhaar?userId=${encodeURIComponent(userId)}`)
      .then((res) => res.json())
      .then((body) => {
        if (!active) return;
        const data = body?.data ?? {};
        let next: AadhaarKycStatus = data.status ?? 'unknown';

        // The server is the source of truth, but if the row/table isn't
        // reachable, trust the local "submitted" flag so a host who just
        // uploaded still sees "pending" rather than "not started".
        if ((next === 'none' || next === 'unknown') && hasSubmittedAadhaarKyc(userId)) {
          next = 'pending';
        }
        // Keep the local flag in sync so offline reads stay accurate.
        if (next === 'pending' || next === 'verified') markAadhaarKycSubmitted(userId);

        setStatus(next);
        setLast4(data.last4 ?? null);
        setSubmittedAt(data.submittedAt ?? null);
      })
      .catch(() => {
        if (!active) return;
        setStatus(hasSubmittedAadhaarKyc(userId) ? 'pending' : 'unknown');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId, nonce]);

  return { status, last4, submittedAt, deferred, loading, refresh };
}
