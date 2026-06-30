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
    const data = await createFeedback({
      userId: userId ?? null,
      type: String(type),
      description: String(description),
      category: category ?? null,
      rating: rating === undefined || rating === null ? null : Number(rating),
      comment: comment ?? null,
    });
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("[/api/feedback] error:", err?.message, err?.code);
    return NextResponse.json({ error: err?.message || "Request failed" }, { status: 500 });
  }
}
