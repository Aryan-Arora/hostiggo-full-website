import { NextResponse } from "next/server";
import { getCachedRoomTypes } from "@/lib/services/cached-reference-data";
import { errorMessage } from "@/lib/api-error";

export async function GET() {
  try {
    const data = await getCachedRoomTypes();
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[/api/room-types] error:", err);
    return NextResponse.json(
      { error: errorMessage(err, "Request failed") },
      { status: 500 },
    );
  }
}
