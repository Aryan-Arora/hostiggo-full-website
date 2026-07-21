import { NextResponse } from "next/server";
import { HotelServiceApi } from "@/lib/services/hotel";
import { errorMessage } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await HotelServiceApi.getUniqueRoomType();
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[/api/room-types] error:", err);
    return NextResponse.json(
      { error: errorMessage(err, "Request failed") },
      { status: 500 },
    );
  }
}
