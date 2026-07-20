import { NextRequest, NextResponse } from 'next/server';
import * as houseRulesService from '@/lib/services/house-rules';
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

    const rules = await houseRulesService.getListingHouseRules(listingId);
    return NextResponse.json({ data: rules });
  } catch (error) {
    console.error('[api/house-rules] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch house rules' },
      { status: 500 }
    );
  }
}

// House rules are one structured row per listing (booleans + times), not a
// list — so saving is always an upsert on the whole row, not add/edit/delete
// of individual items.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { listingId: string } }
) {
  try {
    const listingId = parseInt(params.listingId, 10);
    if (isNaN(listingId)) {
      return NextResponse.json({ error: 'Invalid listing ID' }, { status: 400 });
    }

    const body = await request.json();
    const { check_in_time, check_out_time, smoking_allowed, pets_allowed, parties_allowed, quiet_hours, userId } = body;
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    await assertListingOwnedBy(listingId, String(userId));

    const updated = await houseRulesService.upsertHouseRules(listingId, {
      check_in_time,
      check_out_time,
      smoking_allowed,
      pets_allowed,
      parties_allowed,
      quiet_hours,
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('[api/house-rules] PATCH error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save house rules' },
      { status: 500 }
    );
  }
}
