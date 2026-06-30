import { NextRequest, NextResponse } from "next/server";
import { uploadListingPhoto } from "@/lib/services/admin-writes";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 400 });
    }
    const url = await uploadListingPhoto({
      data: await file.arrayBuffer(),
      name: file.name,
      type: file.type,
    });
    return NextResponse.json({ data: { url } });
  } catch (err: any) {
    console.error("[/api/host/upload] error:", err?.message);
    return NextResponse.json({ error: err?.message ?? "Upload failed" }, { status: 500 });
  }
}
