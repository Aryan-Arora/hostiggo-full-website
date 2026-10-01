import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth-server';
import * as addonService from '@/lib/services/addons';
import { assertListingOwnedBy } from '@/lib/services/admin-writes';
import { errorMessage } from "@/lib/api-error";

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ listingId: string; id: string }> }
) {
  const params = await props.params;
  try {
    const addonListingId = parseInt(params.id, 10);
    const listingId = parseInt(params.listingId, 10);
    if (isNaN(addonListingId) || isNaN(listingId)) {
      return NextResponse.json({ error: 'Invalid addon listing ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      price,
      includes,
      timing_from,
      timing_to,
      another_details,
      additional_notes,
    } = body;

    const authedUserId = await requireUserId(request);
    if (authedUserId instanceof NextResponse) return authedUserId;
    await assertListingOwnedBy(listingId, authedUserId);

    const addon = await addonService.updateListingAddon(
      addonListingId,
      price,
      includes,
      timing_from,
      timing_to,
      another_details,
      additional_notes,
      listingId
    );

    return NextResponse.json({ data: addon });
  } catch (error) {
    console.error('[api/addons/id] PATCH error:', error);
    return NextResponse.json(
      { error: errorMessage(error, 'Failed to update addon') },
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
    const addonListingId = parseInt(params.id, 10);
    const listingId = parseInt(params.listingId, 10);
    if (isNaN(addonListingId) || isNaN(listingId)) {
      return NextResponse.json({ error: 'Invalid addon listing ID' }, { status: 400 });
    }

    const authedUserId = await requireUserId(request);
    if (authedUserId instanceof NextResponse) return authedUserId;
    await assertListingOwnedBy(listingId, authedUserId);

    await addonService.removeAddonFromListing(addonListingId, listingId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/addons/id] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove addon' },
      { status: 500 }
    );
  }
}
