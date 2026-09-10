import { NextRequest, NextResponse } from "next/server";
import { createFeedback } from "@/lib/services/admin-writes";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, type, description, category, rating, comment } = body ?? {};
    if (!type || !description?.trim()) {
      return NextResponse.json(
        { error: "type and description are required" },
        { status: 400 },
      );
    }
    if (String(description).length > 5000) {
      return NextResponse.json(
        { error: "description must be 5000 characters or fewer" },
        { status: 400 },
      );
    }
    const numericRating =
      rating === undefined || rating === null ? null : Number(rating);
    if (numericRating !== null && (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5)) {
      return NextResponse.json(
        { error: "rating must be a whole number between 1 and 5" },
        { status: 400 },
      );
    }
    const data = await createFeedback({
      userId: userId ?? null,
      type: String(type),
      description: String(description),
      category: category ?? null,
      rating: numericRating,
      comment: comment ?? null,
    });
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("[/api/feedback] error:", err?.message, err?.code);
    return NextResponse.json({ error: err?.message || "Request failed" }, { status: 500 });
  }
}
