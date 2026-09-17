import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthenticatedUserId, UnauthorizedError } from "@/lib/auth-server";
import { isSurepassConfigured, surepassPost, maskMiddle, logKycRequest } from "@/lib/surepass";

export const dynamic = "force-dynamic";

// Standard PAN format: 5 letters + 4 digits + 1 letter.
const PAN_RE = /^[A-Z]{5}\d{4}[A-Z]$/;
const PAN_ADVANCED_ENDPOINT = "/api/v1/pan/pan-adv";

// PAN Advanced product -- direct number lookup, no document photo. Mirrors
// the confirmed contract already deployed in the surepass-verify-id Edge
// Function (same Supabase project, ported here so this site can call
// SurePass directly instead of proxying through that function).
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);

    const body = await req.json().catch(() => ({}));
    const idNumber = String(body?.idNumber ?? "").trim().toUpperCase();
    if (!PAN_RE.test(idNumber)) {
      return NextResponse.json({ error: "Enter a valid PAN (e.g. ABCDE1234F)." }, { status: 400 });
    }

    if (!isSurepassConfigured()) {
      return NextResponse.json({
        data: {
          status: "pending",
          reason: "Identity verification is not configured yet (missing SUREPASS_API_KEY).",
        },
      });
    }

    const res = await surepassPost(PAN_ADVANCED_ENDPOINT, { id_number: idNumber });
    const json = await res.json().catch(() => ({}));

    let status: "verified" | "rejected" | "pending";
    let reason: string | null = null;
    let providerReference: string | null = null;
    let data: Record<string, unknown> | null = null;

    if (!res.ok || !json?.success) {
      console.error("[api/verify/pan] pan-adv error:", res.status, json);
      status = "pending";
      reason = json?.message || `Verification provider error (${res.status}).`;
    } else {
      data = (json.data ?? {}) as Record<string, unknown>;
      providerReference = typeof data.client_id === "string" ? data.client_id : null;
      // "E" = "EXISTING AND VALID" per SurePass's pan_status codes.
      if (data.pan_status === "E") {
        status = "verified";
      } else {
        status = "rejected";
        reason = typeof data.pan_status_desc === "string" ? data.pan_status_desc : "PAN could not be verified.";
      }
    }

    const kycRequestId = await logKycRequest({
      userId,
      serviceType: "pan",
      maskedId: maskMiddle(idNumber),
      status,
      providerReference,
      errorMessage: reason,
    });
    if (kycRequestId) {
      await supabaseAdmin.from("pan_verifications").insert({
        kyc_request_id: kycRequestId,
        pan_number_masked: maskMiddle(idNumber),
        full_name: data?.full_name ?? null,
        pan_status: data?.pan_status ?? null,
        pan_status_desc: data?.pan_status_desc ?? null,
        aadhaar_seeding_status: data?.aadhaar_seeding_status_desc ?? data?.aadhaar_seeding_status ?? null,
        is_valid: status === "verified",
      });
    }

    // Second of the two conditions needed to auto-onboard a host to
    // Razorpay Route may now be met -- see maybeAutoOnboardHostToRoute.
    // No-op for non-hosts or hosts missing the other condition; never
    // blocks this response.
    if (status === "verified") {
      const { maybeAutoOnboardHostToRoute } = await import("@/lib/services/hostRouteOnboarding");
      await maybeAutoOnboardHostToRoute(userId);
    }

    return NextResponse.json({ data: { status, reason, providerReference } });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("[api/verify/pan] unexpected error:", err);
    return NextResponse.json(
      { data: { status: "pending", reason: "Verification failed unexpectedly. Please try again." } },
      { status: 200 },
    );
  }
}
