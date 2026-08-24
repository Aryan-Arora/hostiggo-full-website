import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ listingId: string }> }
) {
  try {
    const params = await props.params;
    const listingId = params.listingId;

    // TODO: Fetch photos from database
    // For now, return empty array
    return NextResponse.json({ data: [] });
  } catch (error) {
    console.error('Failed to fetch photos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ listingId: string }> }
) {
  try {
    const params = await props.params;
    const listingId = params.listingId;
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // TODO: Upload file and save to database
    // For now, just echo back
    return NextResponse.json({
      data: {
        id: Math.random(),
        url: URL.createObjectURL(file),
        fileName: file.name,
      },
    });
  } catch (error) {
    console.error('Failed to upload photo:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ listingId: string }> }
) {
  try {
    const params = await props.params;
    const listingId = params.listingId;
    const { photoId } = await req.json();

    if (!photoId) {
      return NextResponse.json(
        { error: 'photoId is required' },
        { status: 400 }
      );
    }

    // TODO: Delete photo from database
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete photo:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
