import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// Live id-proof KYC status for a user, so the host dashboard banner and
// Settings -> Identity Verification reflect the real verification state
// instead of a client-only "I submitted once" localStorage flag. Follows
// the same ?userId= convention as GET /api/users and /api/host/profile-info.
//
// Id proof is PAN, verified through /api/verify/pan -- the latest
// kyc_requests row for service_type='pan' is the source of truth.
//
// status:
//   'none'     -- no PAN submission on file
//   'verified' -- PAN verified by SurePass
//   'rejected' -- most recent submission was rejected, host needs to re-submit
//   'unknown'  -- couldn't read (storage error); caller should fall back to
//                 its local flag rather than assume 'none'
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // A single verified PAN is enough, even if a later retry was rejected.
    const [verified, latest] = await Promise.all([
      supabaseAdmin
        .from('kyc_requests')
        .select('created_at')
        .eq('user_id', userId)
        .eq('service_type', 'pan')
        .eq('status', 'verified')
        .order('created_at', { ascending: false })
        .limit(1)
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

    if (verified.error || latest.error) {
      console.error('[api/kyc/status] failed to read status:', verified.error ?? latest.error);
      return NextResponse.json({ data: { status: 'unknown' } }, { status: 200 });
    }

    if (verified.data) {
      return NextResponse.json({
        data: { status: 'verified', submittedAt: verified.data.created_at, reason: null },
      });
    }
    if (!latest.data) {
      return NextResponse.json({ data: { status: 'none' } });
    }
    return NextResponse.json({
      data: {
        status: 'rejected',
        submittedAt: latest.data.created_at,
        reason: latest.data.error_message ?? null,
      },
    });
  } catch (err) {
    console.error('[api/kyc/status] unexpected error reading status:', err);
    return NextResponse.json({ data: { status: 'unknown' } }, { status: 200 });
  }
}
