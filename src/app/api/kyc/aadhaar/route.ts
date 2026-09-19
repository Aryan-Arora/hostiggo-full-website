import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isValidAadhaarNumber } from '@/lib/aadhaar';
import { getAuthenticatedUserId, UnauthorizedError } from '@/lib/auth-server';
import { isSurepassConfigured, surepassPost } from '@/lib/surepass';

export const dynamic = 'force-dynamic';

// SurePass "Aadhaar Validation" -- a direct number lookup against UIDAI, no
// OTP and no document photo. Same family as PAN Advanced (/api/verify/pan)
// and Bank Verification (/api/verify/bank): a masked-data live check keyed
// only off the number itself.
const AADHAAR_VALIDATION_ENDPOINT = '/api/v1/aadhaar-validation/aadhaar-validation';

// Live id-proof KYC status for a user, so the host dashboard banner and
// Settings -> Identity Verification reflect the real verification state
// instead of a client-only "I submitted once" localStorage flag. Follows
// the same ?userId= convention as GET /api/users and /api/host/profile-info.
//
// Id proof is Aadhaar OR PAN -- not Aadhaar only. This endpoint's name and
// the aadhaar_kyc table predate PAN being an option in the KYC modal
// (src/app/kyc/aadhaar/_components/KycVerificationForm.tsx), but the status
// it reports must cover both, the same way
// src/lib/services/hostRouteOnboarding.ts already treats them as
// interchangeable when deciding Route eligibility: a host who verified via
// PAN only must show as verified here too, not "none" forever because they
// never touched the Aadhaar tab.
//
// status:
//   'none'     -- no submission on file (neither Aadhaar nor PAN)
//   'pending'  -- submitted, awaiting review
//   'verified' -- verified by a reviewer/provider (either id type)
//   'rejected' -- most recent submission was rejected, host needs to re-submit
//   'unknown'  -- couldn't read (table missing, storage error); caller
//                 should fall back to its local flag rather than assume 'none'
const STATUS_RANK = { verified: 3, pending: 2, rejected: 1 } as const;

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const [aadhaarResult, panResult] = await Promise.all([
      supabaseAdmin
        .from('aadhaar_kyc')
        .select('status, aadhaar_last4, submitted_at, updated_at, reason')
        .eq('user_id', userId)
        .maybeSingle(),
      supabaseAdmin
        .from('kyc_requests')
        .select('status, error_message, created_at')
        .eq('user_id', userId)
        .eq('service_type', 'pan')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (aadhaarResult.error && panResult.error) {
      // Same reasoning as the POST handler below: a storage problem (e.g.
      // the migration not applied) must never break the pages that call
      // this. Report 'unknown' and let the client fall back to its local
      // flag.
      console.error('[api/kyc/aadhaar] failed to read status:', aadhaarResult.error, panResult.error);
      return NextResponse.json({ data: { status: 'unknown' } }, { status: 200 });
    }

    const aadhaarRow = aadhaarResult.data;
    const panRow = panResult.data;
    // kyc_requests rows for service_type='pan' only ever carry these two
    // literal statuses (see src/app/api/verify/pan/route.ts) -- no 'pending'
    // state exists for PAN since it's a synchronous SurePass lookup.
    const panStatus = panRow?.status as 'verified' | 'rejected' | undefined;

    const aadhaarRank = aadhaarRow ? STATUS_RANK[aadhaarRow.status as 'pending' | 'verified' | 'rejected'] : 0;
    const panRank = panStatus ? STATUS_RANK[panStatus] : 0;

    if (aadhaarRank === 0 && panRank === 0) {
      return NextResponse.json({ data: { status: 'none' } });
    }

    const aadhaarWins = aadhaarRank >= panRank;
    return NextResponse.json({
      data: {
        status: aadhaarWins ? aadhaarRow!.status : panStatus,
        last4: aadhaarRow?.aadhaar_last4 ?? null,
        submittedAt: aadhaarRow?.submitted_at ?? panRow?.created_at ?? null,
        updatedAt: aadhaarRow?.updated_at ?? null,
        reason: aadhaarWins ? (aadhaarRow?.reason ?? null) : (panRow?.error_message ?? null),
      },
    });
  } catch (err) {
    console.error('[api/kyc/aadhaar] unexpected error reading status:', err);
    return NextResponse.json({ data: { status: 'unknown' } }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // The verified caller identity, not the (spoofable) userId in the body,
    // is what we actually write against -- same rule /api/verify/* follows.
    const userId = await getAuthenticatedUserId(req);

    const { fullName, aadhaarNumber } = await req.json();

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return NextResponse.json({ error: 'fullName is required' }, { status: 400 });
    }

    const digits = String(aadhaarNumber ?? '').replace(/\s+/g, '');
    if (!isValidAadhaarNumber(digits)) {
      return NextResponse.json({ error: 'Enter a valid 12-digit Aadhaar number' }, { status: 400 });
    }

    // Never store the raw number -- last 4 digits (for display) plus a hash
    // (for duplicate detection / future provider matching) only.
    const last4 = digits.slice(-4);
    const hash = createHash('sha256').update(digits).digest('hex');

    // Live verification via a direct SurePass call -- same pattern as
    // /api/verify/pan and /api/verify/bank (number-only lookup, no document
    // photo, no OTP). Failure of any kind fails soft to 'pending' so a
    // provider hiccup never blocks the host's submission from being saved.
    let status: 'pending' | 'verified' | 'rejected' = 'pending';
    let providerReference: string | null = null;
    let reason: string | null = null;

    if (!isSurepassConfigured()) {
      reason = 'Identity verification is not configured yet (missing SUREPASS_API_KEY).';
    } else {
      try {
        const res = await surepassPost(AADHAAR_VALIDATION_ENDPOINT, { id_number: digits });
        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.success) {
          console.error('[api/kyc/aadhaar] aadhaar-validation error:', res.status, json);
          reason = json?.message || `Verification provider error (${res.status}).`;
        } else {
          const data = (json.data ?? {}) as Record<string, unknown>;
          status = 'verified';
          providerReference = typeof data.client_id === 'string' ? data.client_id : null;
        }
      } catch (err) {
        console.error('[api/kyc/aadhaar] unexpected error calling SurePass:', err);
      }
    }

    const { error } = await supabaseAdmin
      .from('aadhaar_kyc')
      .upsert(
        {
          user_id: userId,
          full_name: fullName.trim(),
          aadhaar_last4: last4,
          aadhaar_hash: hash,
          status,
          provider_reference: providerReference,
          reason,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

    if (error) {
      // Don't hard-fail the login flow over a storage problem (e.g. the
      // migrations/003_aadhaar_kyc.sql table not having been applied yet)
      // -- log it server-side and tell the client submission wasn't
      // persisted, but let them proceed. A missing table should never be
      // able to lock every user out of signing in.
      console.error('[api/kyc/aadhaar] failed to persist submission:', error);
      return NextResponse.json({ data: { persisted: false } }, { status: 200 });
    }

    // If this user is a host who also already has a verified bank account,
    // this Aadhaar verification may be the second of the two conditions
    // needed to auto-onboard them to Razorpay Route -- see
    // maybeAutoOnboardHostToRoute for the full gating logic. No-op for
    // guests or hosts who aren't there yet; never blocks this response.
    if (status === 'verified') {
      const { maybeAutoOnboardHostToRoute } = await import('@/lib/services/hostRouteOnboarding');
      await maybeAutoOnboardHostToRoute(userId);
    }

    return NextResponse.json({ data: { persisted: true, status, reason } });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error('[api/kyc/aadhaar] unexpected error:', err);
    return NextResponse.json({ data: { persisted: false } }, { status: 200 });
  }
}
