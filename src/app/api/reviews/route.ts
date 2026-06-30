import { NextRequest, NextResponse } from "next/server";
import { createReview } from "@/lib/services/admin-writes";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { listingId, userId, rating, comment } = (await req.json()) ?? {};
    if (!listingId || !userId || !rating) {
      return NextResponse.json(
        { error: "listingId, userId and rating are required" },
        { status: 400 },
      );
    }
    const data = await createReview({
      listingId: Number(listingId),
      userId: String(userId),
      rating: Number(rating),
      comment: comment ?? null,
    });
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("[/api/reviews] error:", err?.message, err?.code);
    return NextResponse.json({ error: err?.message ?? "Request failed", code: err?.code }, { status: 500 });
  }
}
