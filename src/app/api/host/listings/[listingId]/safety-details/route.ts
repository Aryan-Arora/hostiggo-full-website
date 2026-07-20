import { NextRequest, NextResponse } from 'next/server';
import * as safetyDetailsService from '@/lib/services/safety-details';
import { assertListingOwnedBy } from '@/lib/services/admin-writes';

export async function GET(
  request: NextRequest,
  { params }: { params: { listingId: string } }
) {
  try {
    const listingId = parseInt(params.listingId, 10);
    if (isNaN(listingId)) {
      return NextResponse.json({ error: 'Invalid listing ID' }, { status: 400 });
    }

    const [allFeatures, selectedDetails] = await Promise.all([
      safetyDetailsService.getAllSafetyFeatures(),
      safetyDetailsService.getListingSafetyDetails(listingId),
    ]);

    return NextResponse.json({
      data: {
        available: allFeatures,
        selected: selectedDetails,
      },
    });
  } catch (error) {
    console.error('[api/safety-details] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch safety details' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { listingId: string } }
) {
  try {
    const listingId = parseInt(params.listingId, 10);
    if (isNaN(listingId)) {
      return NextResponse.json({ error: 'Invalid listing ID' }, { status: 400 });
    }

    const body = await request.json();
    const { feature_id, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    await assertListingOwnedBy(listingId, String(userId));

    if (!feature_id) {
      return NextResponse.json(
        { error: 'Missing required field: feature_id' },
        { status: 400 }
      );
    }

    const detail = await safetyDetailsService.addSafetyDetailToListing(listingId, feature_id);
    return NextResponse.json({ data: detail }, { status: 201 });
  } catch (error) {
    console.error('[api/safety-details] POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add safety detail' },
      { status: 500 }
    );
  }
}
