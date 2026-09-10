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
    // The review table has no CHECK constraint on rating, so an out-of-range
    // value (0, 999, 4.7) would silently poison every average computed from
    // it -- enforce the 1-5 integer scale the UI offers.
    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json(
        { error: "rating must be a whole number between 1 and 5" },
        { status: 400 },
      );
    }
    if (comment != null && String(comment).length > 2000) {
      return NextResponse.json(
        { error: "comment must be 2000 characters or fewer" },
        { status: 400 },
      );
    }
    const data = await createReview({
      listingId: Number(listingId),
      userId: String(userId),
      rating: numericRating,
      comment: comment ?? null,
    });
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("[/api/reviews] error:", err?.message, err?.code);
    return NextResponse.json({ error: err?.message ?? "Request failed", code: err?.code }, { status: 500 });
  }
}
