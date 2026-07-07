import { NextRequest, NextResponse } from 'next/server';
import * as houseRulesService from '@/lib/services/house-rules';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { listingId: string; id: string } }
) {
  try {
    const ruleId = parseInt(params.id, 10);
    if (isNaN(ruleId)) {
      return NextResponse.json({ error: 'Invalid rule ID' }, { status: 400 });
    }

    const body = await request.json();
    const { rule } = body;

    if (!rule) {
      return NextResponse.json(
        { error: 'Missing required field: rule' },
        { status: 400 }
      );
    }

    const updated = await houseRulesService.updateHouseRule(ruleId, rule);
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('[api/house-rules/id] PATCH error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update house rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { listingId: string; id: string } }
) {
  try {
    const ruleId = parseInt(params.id, 10);
    if (isNaN(ruleId)) {
      return NextResponse.json({ error: 'Invalid rule ID' }, { status: 400 });
    }

    await houseRulesService.deleteHouseRule(ruleId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/house-rules/id] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete house rule' },
      { status: 500 }
    );
  }
}
