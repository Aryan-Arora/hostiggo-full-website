import { NextRequest, NextResponse } from "next/server";
import { HotelServiceApi } from "@/lib/services/hotel";
import { errorMessage } from "@/lib/api-error";

export const dynamic = "force-dynamic";

const jsonError = (err: unknown, status = 500) => {
  console.error("[/api/locations] error:", err);
  return NextResponse.json({ error: errorMessage(err, "Request failed") }, { status });
};

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q");
    const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 22));
    const popular = req.nextUrl.searchParams.get("popular") === "1";

    const data = query
      ? await HotelServiceApi.searchLocations(query)
      : popular
        ? await HotelServiceApi.getPopularLocations(limit)
        : await HotelServiceApi.getLocationSample(limit);

    return NextResponse.json({ data });
  } catch (err) {
    return jsonError(err);
  }
}
