import { NextRequest, NextResponse } from "next/server";
import { assertListingOwnedBy, setCoverPhoto } from "@/lib/services/admin-writes";
import { requireUserId } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/host/listings/[listingId]/cover
 * Set the listing's cover photo. Body: { mediaId }. Clears any existing cover
 * and flags the chosen row so there is always exactly one is_cover per listing
 * (Rule B).
 */
export async function PATCH(req: NextRequest, props: { params: Promise<{ listingId: string }> }) {
  const params = await props.params;
  try {
    const listingId = parseInt(params.listingId, 10);
    if (isNaN(listingId)) {
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
    }

    const userId = await requireUserId(req);
    if (userId instanceof NextResponse) return userId;
    await assertListingOwnedBy(listingId, userId);

    const body = await req.json().catch(() => ({}));
    // media_id is a UUID string, so keep it as text (never coerce to a number).
    const mediaId = typeof body?.mediaId === "string" ? body.mediaId.trim() : "";
    if (!mediaId) {
      return NextResponse.json({ error: "mediaId is required" }, { status: 400 });
    }

    const data = await setCoverPhoto(listingId, mediaId);
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("[PATCH /api/host/listings/[listingId]/cover] error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to set cover photo" },
      { status: 500 },
    );
  }
}
