import { NextRequest, NextResponse } from 'next/server';
import * as discountService from '@/lib/services/discounts';
import { assertListingOwnedBy } from '@/lib/services/admin-writes';
import { errorMessage } from "@/lib/api-error";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { listingId: string; id: string } }
) {
  try {
    const discountId = parseInt(params.id, 10);
    const listingId = parseInt(params.listingId, 10);
    if (isNaN(discountId) || isNaN(listingId)) {
      return NextResponse.json({ error: 'Invalid discount ID' }, { status: 400 });
    }

    const body = await request.json();
    const { percent, enabled, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    await assertListingOwnedBy(listingId, String(userId));

    const discount = await discountService.updateDiscount(
      discountId,
      percent,
      enabled,
      listingId
    );

    return NextResponse.json({ data: discount });
  } catch (error) {
    console.error('[api/discounts/id] PATCH error:', error);
    return NextResponse.json(
      { error: errorMessage(error, 'Failed to update discount') },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { listingId: string; id: string } }
) {
  try {
    const discountId = parseInt(params.id, 10);
    const listingId = parseInt(params.listingId, 10);
    if (isNaN(discountId) || isNaN(listingId)) {
      return NextResponse.json({ error: 'Invalid discount ID' }, { status: 400 });
    }

    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    await assertListingOwnedBy(listingId, userId);

    await discountService.deleteDiscount(discountId, listingId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/discounts/id] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete discount' },
      { status: 500 }
    );
  }
}
