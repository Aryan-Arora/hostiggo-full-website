import { NextRequest, NextResponse } from 'next/server';
import * as addonService from '@/lib/services/addons';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { listingId: string; id: string } }
) {
  try {
    const addonListingId = parseInt(params.id, 10);
    if (isNaN(addonListingId)) {
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

    const addon = await addonService.updateListingAddon(
      addonListingId,
      price,
      includes,
      timing_from,
      timing_to,
      another_details,
      additional_notes
    );

    return NextResponse.json({ data: addon });
  } catch (error) {
    console.error('[api/addons/id] PATCH error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update addon' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { listingId: string; id: string } }
) {
  try {
    const addonListingId = parseInt(params.id, 10);
    if (isNaN(addonListingId)) {
      return NextResponse.json({ error: 'Invalid addon listing ID' }, { status: 400 });
    }

    await addonService.removeAddonFromListing(addonListingId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/addons/id] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove addon' },
      { status: 500 }
    );
  }
}
