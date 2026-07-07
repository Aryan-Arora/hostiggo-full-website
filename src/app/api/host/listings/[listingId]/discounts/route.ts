import { NextRequest, NextResponse } from 'next/server';
import * as discountService from '@/lib/services/discounts';

export async function GET(
  request: NextRequest,
  { params }: { params: { listingId: string } }
) {
  try {
    const listingId = parseInt(params.listingId, 10);
    if (isNaN(listingId)) {
      return NextResponse.json({ error: 'Invalid listing ID' }, { status: 400 });
    }

    const discounts = await discountService.getListingDiscounts(listingId);
    return NextResponse.json({ data: discounts });
  } catch (error) {
    console.error('[api/discounts] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discounts' },
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
    const { discount_type, percent } = body;

    if (!discount_type || percent === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: discount_type, percent' },
        { status: 400 }
      );
    }

    const discount = await discountService.createDiscount(
      listingId,
      discount_type,
      percent
    );

    return NextResponse.json({ data: discount }, { status: 201 });
  } catch (error) {
    console.error('[api/discounts] POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create discount' },
      { status: 500 }
    );
  }
}
