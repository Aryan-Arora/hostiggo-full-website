import { NextRequest, NextResponse } from "next/server";
import { HotelServiceApi } from "@/lib/services/hotel";
import { createListing } from "@/lib/services/admin-writes";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    const offset = Number(req.nextUrl.searchParams.get("offset") ?? 0);
    const limit = Number(req.nextUrl.searchParams.get("limit") ?? 24);

    const { data, total } = await HotelServiceApi.getListingsByHost(userId, offset, limit);
    return NextResponse.json({ data, total });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Request failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    const data = await createListing(body);
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("[/api/host/listings POST] error:", err?.message, err?.code, err?.details);
    return NextResponse.json(
      { error: err?.message ?? "Request failed", code: err?.code },
      { status: 500 },
    );
  }
}
