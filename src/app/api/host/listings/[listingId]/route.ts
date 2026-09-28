import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/host/listings/[listingId]
 * Media rows (id + cover flag) for the host manage view's photo manager, so it
 * can render existing photos and drive the set-cover control. Ordered by id for
 * a deterministic "first photo" fallback (Rule C).
 */
export async function GET(_req: NextRequest, props: { params: Promise<{ listingId: string }> }) {
  const params = await props.params;
  try {
    const listingId = parseInt(params.listingId, 10);
    if (isNaN(listingId)) {
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("listing_media")
      .select("id, media_url, media_type, is_cover")
      .eq("listing_id", listingId)
      .order("id", { ascending: true });
    if (error) throw error;

    return NextResponse.json({ data: data ?? [] });
  } catch (err: any) {
    console.error("[GET /api/host/listings/[listingId]] error:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to load photos" }, { status: 500 });
  }
}

// There is intentionally no DELETE handler any more. "Remove listing" used
// to hard-delete the listing and its child rows here -- with no
// authentication or ownership check at all. Removal is now a recorded,
// deferred delist request: see ./delist/route.ts and the
// process_pending_delistings() pg_cron job.
