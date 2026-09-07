import { NextRequest, NextResponse } from "next/server";
import { setCoverPhoto } from "@/lib/services/admin-writes";

export const dynamic = "force-dynamic";

// PATCH /api/host/listings/[listingId]/cover — set the listing's cover photo.
// Body: { mediaId }. Clears any existing cover and flags the chosen row so there
// is always exactly one is_cover per listing (Rule B).
export async function PATCH(
  req: NextRequest,
  { params }: { params: { listingId: string } },
) {
  try {
    const listingId = Number.parseInt(params.listingId, 10);
    if (!Number.isFinite(listingId)) {
      return NextResponse.json({ error: "Invalid listingId" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    // media_id is a UUID string, so keep it as text (never coerce to a number).
    const mediaId = typeof body?.mediaId === "string" ? body.mediaId.trim() : "";
    if (!mediaId) {
      return NextResponse.json({ error: "mediaId is required" }, { status: 400 });
    }

    const data = await setCoverPhoto(listingId, mediaId);
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("[/api/host/listings/[listingId]/cover PATCH] error:", err?.message);
    return NextResponse.json({ error: err?.message ?? "Request failed" }, { status: 500 });
  }
}
