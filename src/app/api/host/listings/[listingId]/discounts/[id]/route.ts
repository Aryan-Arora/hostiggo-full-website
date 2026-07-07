import { NextRequest, NextResponse } from 'next/server';
import * as discountService from '@/lib/services/discounts';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { listingId: string; id: string } }
) {
  try {
    const discountId = parseInt(params.id, 10);
    if (isNaN(discountId)) {
      return NextResponse.json({ error: 'Invalid discount ID' }, { status: 400 });
    }

    const body = await request.json();
    const { percent, enabled } = body;

    const discount = await discountService.updateDiscount(
      discountId,
      percent,
      enabled
    );

    return NextResponse.json({ data: discount });
  } catch (error) {
    console.error('[api/discounts/id] PATCH error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update discount' },
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
    if (isNaN(discountId)) {
      return NextResponse.json({ error: 'Invalid discount ID' }, { status: 400 });
    }

    await discountService.deleteDiscount(discountId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/discounts/id] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete discount' },
      { status: 500 }
    );
  }
}
