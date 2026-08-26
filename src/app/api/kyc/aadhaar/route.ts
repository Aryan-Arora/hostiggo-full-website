import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isValidAadhaarNumber } from '@/lib/aadhaar';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { userId, fullName, aadhaarNumber } = await req.json();

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
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

    const { error } = await supabaseAdmin
      .from('aadhaar_kyc')
      .upsert(
        {
          user_id: userId,
          full_name: fullName.trim(),
          aadhaar_last4: last4,
          aadhaar_hash: hash,
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
