import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthenticatedUserId, UnauthorizedError } from "@/lib/auth-server";
import { isSurepassConfigured, surepassPost, maskMiddle, logKycRequest } from "@/lib/surepass";

export const dynamic = "force-dynamic";

const PASSPORT_VERIFY_ENDPOINT = "/api/v1/passport/passport/verify";

// Looks up a passport record by file number + date of birth (not the
// passport number itself), no document photo. The DOB is always read
// server-side from the caller's own Supabase Auth user_metadata, never from
// the request body -- otherwise a client could probe someone else's
// passport record by guessing DOBs. Mirrors the confirmed contract already
// deployed in the surepass-verify-id Edge Function.
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);

    const body = await req.json().catch(() => ({}));
    const fileNumber = String(body?.fileNumber ?? "").trim().toUpperCase();
    if (!fileNumber) {
      return NextResponse.json({ error: "fileNumber is required" }, { status: 400 });
    }

    const { data: userRecord, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    const dob = userRecord?.user?.user_metadata?.date_of_birth;
    if (userError || typeof dob !== "string" || !dob) {
      return NextResponse.json({
        data: {
          status: "pending",
          reason: "Add your date of birth to your profile before verifying a passport.",
        },
      });
    }

    if (!isSurepassConfigured()) {
      return NextResponse.json({
        data: {
          status: "pending",
          reason: "Identity verification is not configured yet (missing SUREPASS_API_KEY).",
        },
      });
    }

    // SurePass's passport endpoint (unlike pan-adv or bank-verification)
    // requires a caller-supplied `client_id` in the request body -- without
    // it every call fails payload validation before ever looking up the
    // record, regardless of how valid the token or file_number/dob are.
    // Not documented in the contract this was ported from; found by
    // smoke-testing against the real sandbox API.
    const res = await surepassPost(PASSPORT_VERIFY_ENDPOINT, {
      file_number: fileNumber,
      dob,
      client_id: `${userId}-${Date.now()}`,
    });
    const json = await res.json().catch(() => ({}));

    let status: "verified" | "rejected";
    let reason: string | null = null;
    let providerReference: string | null = null;
    let data: Record<string, unknown> | null = null;

    if (!res.ok || !json?.success) {
      console.error("[api/verify/passport] verify error:", res.status, json);
      status = "rejected";
      reason = json?.message || "Could not find a passport record matching that file number and date of birth.";
    } else {
      data = (json.data ?? {}) as Record<string, unknown>;
      status = "verified";
      providerReference = typeof data.client_id === "string" ? data.client_id : null;
    }

    const kycRequestId = await logKycRequest({
      userId,
      serviceType: "passport",
      maskedId: maskMiddle(fileNumber),
      status,
      providerReference,
      errorMessage: reason,
    });
    if (kycRequestId) {
      await supabaseAdmin.from("passport_verifications").insert({
        kyc_request_id: kycRequestId,
        file_number_masked: maskMiddle(fileNumber),
        passport_number_masked:
          typeof data?.passport_num === "string" ? maskMiddle(data.passport_num as string) : null,
        full_name: data?.given_name && data?.surname ? `${data.given_name} ${data.surname}` : null,
        dob,
        nationality: data?.nationality ?? null,
        is_valid: status === "verified",
      });
    }

    return NextResponse.json({ data: { status, reason, providerReference } });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("[api/verify/passport] unexpected error:", err);
    return NextResponse.json(
      { data: { status: "pending", reason: "Verification failed unexpectedly. Please try again." } },
      { status: 200 },
    );
  }
}
