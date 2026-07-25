import { NextResponse } from 'next/server';
import * as addonService from '@/lib/services/addons';

export const dynamic = 'force-dynamic';

// Catalog-only fetch (no listingId) - used by the host onboarding wizard,
// where a listing doesn't exist yet to scope a per-listing addons query to.
export async function GET() {
  try {
    const data = await addonService.getAllAddons();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('[api/addons] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch addons' }, { status: 500 });
  }
}
