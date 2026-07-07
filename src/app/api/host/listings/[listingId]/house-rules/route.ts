import { NextRequest, NextResponse } from 'next/server';
import * as houseRulesService from '@/lib/services/house-rules';

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
    const { rule } = body;

    if (!rule) {
      return NextResponse.json(
        { error: 'Missing required field: rule' },
        { status: 400 }
      );
    }

    const houseRule = await houseRulesService.addHouseRule(listingId, rule);
    return NextResponse.json({ data: houseRule }, { status: 201 });
  } catch (error) {
    console.error('[api/house-rules] POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add house rule' },
      { status: 500 }
    );
  }
}
