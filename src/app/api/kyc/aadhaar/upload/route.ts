import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const MAX_BYTES = 8 * 1024 * 1024;

// Uploads a photo of a host's Aadhaar card (front or back) to the private
// "identity-documents" storage bucket. Deliberately a *separate* path from
// uploadListingPhoto()/LISTING_BUCKET ("homestay photos") -- that bucket is
// public (guests need to see property photos), and a government ID scan
// must never be reachable by a public URL. This bucket has public: false,
// so the only way to read a file back is a short-lived signed URL minted
// server-side (see GET below), never a bare public URL handed to the client.
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const userId = form.get("userId");
    const side = form.get("side");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (typeof userId !== "string" || !userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    if (side !== "front" && side !== "back") {
      return NextResponse.json({ error: "side must be 'front' or 'back'" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 400 });
    }
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_TYPES.has(file.type) || !ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, and WEBP images are allowed" },
        { status: 400 },
      );
    }

    // Deterministic path per (user, side) -- upsert:true so a re-upload
    // (e.g. they picked the wrong photo) replaces it in place instead of
    // littering the bucket with every attempt.
    const path = `aadhaar/${userId}/${side}.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("identity-documents")
      .upload(path, await file.arrayBuffer(), {
        contentType: file.type,
        upsert: true,
      });
    if (uploadError) {
      console.error("[api/kyc/aadhaar/upload] upload failed:", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    // A short-lived signed URL so the host can immediately see a preview of
    // what they just uploaded -- this is the only URL that ever leaves the
    // server for this file; it expires and is never persisted anywhere.
    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from("identity-documents")
      .createSignedUrl(path, 300);
    if (signError) {
      console.error("[api/kyc/aadhaar/upload] sign failed:", signError);
      // The upload itself succeeded -- still return the path so the form
      // can proceed, just without an immediate preview image.
      return NextResponse.json({ data: { path } });
    }

    return NextResponse.json({ data: { path, previewUrl: signed.signedUrl } });
  } catch (err) {
    console.error("[api/kyc/aadhaar/upload] unexpected error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
