import { NextRequest, NextResponse } from 'next/server';
import * as safetyDetailsService from '@/lib/services/safety-details';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { listingId: string; id: string } }
) {
  try {
    const detailId = parseInt(params.id, 10);
    if (isNaN(detailId)) {
      return NextResponse.json({ error: 'Invalid detail ID' }, { status: 400 });
    }

    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required field: enabled (boolean)' },
        { status: 400 }
      );
    }

    const detail = await safetyDetailsService.toggleSafetyDetail(detailId, enabled);
    return NextResponse.json({ data: detail });
  } catch (error) {
    console.error('[api/safety-details/id] PATCH error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update safety detail' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { listingId: string; id: string } }
) {
  try {
    const detailId = parseInt(params.id, 10);
    if (isNaN(detailId)) {
      return NextResponse.json({ error: 'Invalid detail ID' }, { status: 400 });
    }

    await safetyDetailsService.removeSafetyDetailFromListing(detailId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/safety-details/id] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove safety detail' },
      { status: 500 }
    );
  }
}
