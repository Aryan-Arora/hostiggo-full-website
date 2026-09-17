import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthenticatedUserId, UnauthorizedError } from "@/lib/auth-server";
import { isSurepassConfigured, surepassPost, sha256Hex, logKycRequest } from "@/lib/surepass";

export const dynamic = "force-dynamic";

// Standard IFSC format: 4 letters (bank code) + '0' + 6 alphanumeric (branch code).
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const MOBILE_RE = /^\d{10}$/;
const BANK_VERIFICATION_ENDPOINT = "/api/v1/bank-verification/bank-verification-mobile";

// "Bank Verification (Mobile)" product -- a penny-drop-free lookup of the
// bank account linked to a mobile number's UPI handle at the given
// bank/branch. The response has NO raw account number at all, so
// account_hash/account_last4 below are computed from the mobile number, not
// an account number. Mirrors the confirmed contract already deployed in the
// surepass-verify-bank Edge Function.
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);

    const body = await req.json().catch(() => ({}));
    const mobileNumber = String(body?.mobileNumber ?? "").replace(/\s+/g, "");
    const ifsc = String(body?.ifsc ?? "").trim().toUpperCase();

    if (!MOBILE_RE.test(mobileNumber)) {
      return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
    }
    if (!IFSC_RE.test(ifsc)) {
      return NextResponse.json({ error: "Enter a valid IFSC code (e.g. HDFC0001234)." }, { status: 400 });
    }

    if (!isSurepassConfigured()) {
      return NextResponse.json({
        data: { verified: false, reason: "Bank verification is not configured yet (missing SUREPASS_API_KEY)." },
      });
    }

    const logAttempt = (params: { status: string; providerReference: string | null; errorMessage: string | null }) =>
      logKycRequest({
        userId,
        serviceType: "bank",
        maskedId: `***${mobileNumber.slice(-4)}`,
        status: params.status,
        providerReference: params.providerReference,
        errorMessage: params.errorMessage,
      });

    const res = await surepassPost(BANK_VERIFICATION_ENDPOINT, { mobile_number: mobileNumber, ifsc });
    const json = await res.json().catch(() => ({}));

    if (!res.ok || !json?.success) {
      console.error("[api/verify/bank] error:", res.status, json);
      const reason = json?.message || `Verification provider error (${res.status}).`;
      await logAttempt({ status: "failed", providerReference: null, errorMessage: reason });
      return NextResponse.json({ data: { verified: false, reason } });
    }

    const data = (json.data ?? {}) as Record<string, unknown>;
    const ifscDetails = (data.ifsc_details as Record<string, unknown> | undefined) ?? {};
    const providerReference = typeof data.client_id === "string" ? data.client_id : null;

    const kycRequestId = await logAttempt({ status: "success", providerReference, errorMessage: null });
    if (kycRequestId) {
      await supabaseAdmin.from("bank_verifications").insert({
        kyc_request_id: kycRequestId,
        account_hash: sha256Hex(mobileNumber),
        account_last4: mobileNumber.slice(-4),
        ifsc_code: ifsc,
        account_holder_name: data.name ?? null,
        bank_name: ifscDetails.bank ?? null,
        is_valid: true,
      });
    }

    // First of the two conditions needed to auto-onboard a host to
    // Razorpay Route may now be met -- see maybeAutoOnboardHostToRoute.
    // No-op for non-hosts or hosts missing the other condition; never
    // blocks this response.
    const { maybeAutoOnboardHostToRoute } = await import("@/lib/services/hostRouteOnboarding");
    await maybeAutoOnboardHostToRoute(userId);

    return NextResponse.json({
      data: {
        verified: true,
        accountHolderName: data.name ?? null,
        vpa: data.vpa ?? null,
        bankName: ifscDetails.bank ?? null,
        branch: ifscDetails.branch ?? null,
        accountType: data.account_type ?? null,
        providerReference,
      },
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("[api/verify/bank] unexpected error:", err);
    return NextResponse.json(
      { data: { verified: false, reason: "Verification failed unexpectedly. Please try again." } },
      { status: 200 },
    );
  }
}
