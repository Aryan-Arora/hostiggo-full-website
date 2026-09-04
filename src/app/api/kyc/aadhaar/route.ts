import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isValidAadhaarNumber } from '@/lib/aadhaar';

export const dynamic = 'force-dynamic';

// Live KYC status for a user, so the host dashboard banner and Settings ->
// Identity Verification reflect the real verification state instead of a
// client-only "I submitted once" localStorage flag. Follows the same
// ?userId= convention as GET /api/users and /api/host/profile-info.
//
// status:
//   'none'     -- no submission on file
//   'pending'  -- submitted, awaiting review
//   'verified' -- verified by a reviewer/provider
//   'rejected' -- submission was rejected, host needs to re-submit
//   'unknown'  -- couldn't read (table missing, storage error); caller
//                 should fall back to its local flag rather than assume 'none'
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('aadhaar_kyc')
      .select('status, aadhaar_last4, submitted_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      // Same reasoning as the POST handler below: a storage problem (e.g.
      // the migration not applied) must never break the pages that call
      // this. Report 'unknown' and let the client fall back to its local
      // flag.
      console.error('[api/kyc/aadhaar] failed to read status:', error);
      return NextResponse.json({ data: { status: 'unknown' } }, { status: 200 });
    }

    if (!data) {
      return NextResponse.json({ data: { status: 'none' } });
    }

    return NextResponse.json({
      data: {
        status: data.status ?? 'pending',
        last4: data.aadhaar_last4 ?? null,
        submittedAt: data.submitted_at ?? null,
        updatedAt: data.updated_at ?? null,
      },
    });
  } catch (err) {
    console.error('[api/kyc/aadhaar] unexpected error reading status:', err);
    return NextResponse.json({ data: { status: 'unknown' } }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, fullName, aadhaarNumber, frontImagePath, backImagePath } = await req.json();

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return NextResponse.json({ error: 'fullName is required' }, { status: 400 });
    }
    // Both sides required -- a single-side submission isn't enough to
    // actually verify identity against, same reasoning real Aadhaar
    // verification flows use.
    if (typeof frontImagePath !== 'string' || !frontImagePath) {
      return NextResponse.json({ error: 'Front photo of Aadhaar is required' }, { status: 400 });
    }
    if (typeof backImagePath !== 'string' || !backImagePath) {
      return NextResponse.json({ error: 'Back photo of Aadhaar is required' }, { status: 400 });
    }

    const digits = String(aadhaarNumber ?? '').replace(/\s+/g, '');
    if (!isValidAadhaarNumber(digits)) {
      return NextResponse.json({ error: 'Enter a valid 12-digit Aadhaar number' }, { status: 400 });
    }

    // Never store the raw number -- last 4 digits (for display) plus a hash
    // (for duplicate detection / future provider matching) only.
    const last4 = digits.slice(-4);
    const hash = createHash('sha256').update(digits).digest('hex');

    const { error } = await supabaseAdmin
      .from('aadhaar_kyc')
      .upsert(
        {
          user_id: userId,
          full_name: fullName.trim(),
          aadhaar_last4: last4,
          aadhaar_hash: hash,
          front_image_path: frontImagePath,
          back_image_path: backImagePath,
          status: 'pending',
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

    return NextResponse.json({ data: { persisted: true } });
  } catch (err) {
    console.error('[api/kyc/aadhaar] unexpected error:', err);
    return NextResponse.json({ data: { persisted: false } }, { status: 200 });
  }
}
