import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { assertListingOwnedBy, uploadListingPhoto } from '@/lib/services/admin-writes';
import { errorMessage } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 8 * 1024 * 1024;

type MediaRow = { id: number; media_url: string; is_cover: boolean };

async function listPhotos(listingId: number): Promise<MediaRow[]> {
  const { data, error } = await supabaseAdmin
    .from('listing_media')
    .select('id, media_url, is_cover')
    .eq('listing_id', listingId)
    .order('is_cover', { ascending: false })
    .order('id', { ascending: true });
  if (error) throw error;
  return (data ?? []) as MediaRow[];
}

export async function GET(_req: NextRequest, props: { params: Promise<{ listingId: string }> }) {
  const params = await props.params;
  try {
    const listingId = parseInt(params.listingId, 10);
    if (isNaN(listingId)) return NextResponse.json({ error: 'Invalid listing ID' }, { status: 400 });
    return NextResponse.json({ data: await listPhotos(listingId) });
  } catch (error) {
    console.error('[api/listings/photos] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, props: { params: Promise<{ listingId: string }> }) {
  const params = await props.params;
  try {
    const listingId = parseInt(params.listingId, 10);
    if (isNaN(listingId)) return NextResponse.json({ error: 'Invalid listing ID' }, { status: 400 });

    const form = await req.formData();
    const file = form.get('file');
    const userId = form.get('userId');
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 8MB)' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG and WEBP images are allowed' }, { status: 400 });
    }
    await assertListingOwnedBy(listingId, userId);

    const url = await uploadListingPhoto({
      data: await file.arrayBuffer(),
      name: file.name,
      type: file.type,
    });

    const existing = await listPhotos(listingId);
    const { data, error } = await supabaseAdmin
      .from('listing_media')
      .insert({
        listing_id: listingId,
        media_url: url,
        media_type: 'image',
        is_cover: existing.length === 0,
      })
      .select('id, media_url, is_cover')
      .single();
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[api/listings/photos] POST error:', error);
    return NextResponse.json({ error: errorMessage(error, 'Failed to upload photo') }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ listingId: string }> }) {
  const params = await props.params;
  try {
    const listingId = parseInt(params.listingId, 10);
    if (isNaN(listingId)) return NextResponse.json({ error: 'Invalid listing ID' }, { status: 400 });

    const { userId, photoId, action } = await req.json();
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    if (action !== 'make-cover' || !photoId) {
      return NextResponse.json({ error: 'photoId and action=make-cover are required' }, { status: 400 });
    }
    await assertListingOwnedBy(listingId, String(userId));

    const { error: clearErr } = await supabaseAdmin
      .from('listing_media')
      .update({ is_cover: false })
      .eq('listing_id', listingId);
    if (clearErr) throw clearErr;

    const { error: setErr } = await supabaseAdmin
      .from('listing_media')
      .update({ is_cover: true })
      .eq('listing_id', listingId)
      .eq('id', photoId);
    if (setErr) throw setErr;

    return NextResponse.json({ data: await listPhotos(listingId) });
  } catch (error) {
    console.error('[api/listings/photos] PATCH error:', error);
    return NextResponse.json({ error: errorMessage(error, 'Failed to update cover photo') }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ listingId: string }> }) {
  const params = await props.params;
  try {
    const listingId = parseInt(params.listingId, 10);
    if (isNaN(listingId)) return NextResponse.json({ error: 'Invalid listing ID' }, { status: 400 });

    const { userId, photoId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    if (!photoId) return NextResponse.json({ error: 'photoId is required' }, { status: 400 });
    await assertListingOwnedBy(listingId, String(userId));

    const { data: deleted, error } = await supabaseAdmin
      .from('listing_media')
      .delete()
      .eq('listing_id', listingId)
      .eq('id', photoId)
      .select('id, is_cover')
      .maybeSingle();
    if (error) throw error;

    // If the cover was removed, promote the oldest remaining photo.
    if (deleted?.is_cover) {
      const remaining = await listPhotos(listingId);
      if (remaining.length) {
        await supabaseAdmin
          .from('listing_media')
          .update({ is_cover: true })
          .eq('listing_id', listingId)
          .eq('id', remaining[0].id);
      }
    }

    return NextResponse.json({ data: await listPhotos(listingId) });
  } catch (error) {
    console.error('[api/listings/photos] DELETE error:', error);
    return NextResponse.json({ error: errorMessage(error, 'Failed to delete photo') }, { status: 500 });
  }
}
