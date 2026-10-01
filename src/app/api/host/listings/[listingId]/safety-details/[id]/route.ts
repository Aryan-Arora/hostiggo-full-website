import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth-server';
import * as safetyDetailsService from '@/lib/services/safety-details';
import { assertListingOwnedBy } from '@/lib/services/admin-writes';
import { errorMessage } from "@/lib/api-error";

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ listingId: string; id: string }> }
) {
  const params = await props.params;
  try {
    const detailId = parseInt(params.id, 10);
    const listingId = parseInt(params.listingId, 10);
    if (isNaN(detailId) || isNaN(listingId)) {
      return NextResponse.json({ error: 'Invalid detail ID' }, { status: 400 });
    }

    const body = await request.json();
    const { enabled } = body;

    const authedUserId = await requireUserId(request);
    if (authedUserId instanceof NextResponse) return authedUserId;
    await assertListingOwnedBy(listingId, authedUserId);

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required field: enabled (boolean)' },
        { status: 400 }
      );
    }

    const detail = await safetyDetailsService.toggleSafetyDetail(detailId, enabled, listingId);
    return NextResponse.json({ data: detail });
  } catch (error) {
    console.error('[api/safety-details/id] PATCH error:', error);
    return NextResponse.json(
      { error: errorMessage(error, 'Failed to update safety detail') },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ listingId: string; id: string }> }
) {
  const params = await props.params;
  try {
    const detailId = parseInt(params.id, 10);
    const listingId = parseInt(params.listingId, 10);
    if (isNaN(detailId) || isNaN(listingId)) {
      return NextResponse.json({ error: 'Invalid detail ID' }, { status: 400 });
    }

    const authedUserId = await requireUserId(request);
    if (authedUserId instanceof NextResponse) return authedUserId;
    await assertListingOwnedBy(listingId, authedUserId);

    await safetyDetailsService.removeSafetyDetailFromListing(detailId, listingId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/safety-details/id] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove safety detail' },
      { status: 500 }
    );
  }
}
