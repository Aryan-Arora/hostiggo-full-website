import { NextRequest, NextResponse } from 'next/server';
import * as addonService from '@/lib/services/addons';
import { assertListingOwnedBy } from '@/lib/services/admin-writes';
import { errorMessage } from "@/lib/api-error";

export async function GET(
  request: NextRequest,
  { params }: { params: { listingId: string } }
) {
  try {
    const listingId = parseInt(params.listingId, 10);
    if (isNaN(listingId)) {
      return NextResponse.json({ error: 'Invalid listing ID' }, { status: 400 });
    }

    const [allAddons, listingAddons] = await Promise.all([
      addonService.getAllAddons(),
      addonService.getListingAddons(listingId),
    ]);

    return NextResponse.json({
      data: {
        available: allAddons,
        selected: listingAddons,
      },
    });
  } catch (error) {
    console.error('[api/addons] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addons' },
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
    const {
      addon_id,
      price,
      includes,
      timing_from,
      timing_to,
      another_details,
      additional_notes,
      userId,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    await assertListingOwnedBy(listingId, String(userId));

    if (addon_id === undefined || price === undefined || !includes) {
      return NextResponse.json(
        { error: 'Missing required fields: addon_id, price, includes' },
        { status: 400 }
      );
    }

    const addon = await addonService.addAddonToListing(
      listingId,
      addon_id,
      price,
      includes,
      timing_from,
      timing_to,
      another_details,
      additional_notes
    );

    return NextResponse.json({ data: addon }, { status: 201 });
  } catch (error) {
    console.error('[api/addons] POST error:', error);
    return NextResponse.json(
      { error: errorMessage(error, 'Failed to add addon') },
      { status: 500 }
    );
  }
}
