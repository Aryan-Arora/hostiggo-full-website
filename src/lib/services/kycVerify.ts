import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isSurepassConfigured, surepassPost, maskMiddle, sha256Hex, logKycRequest } from "@/lib/surepass";

// Shared SurePass verification, used by /api/verify/bank, /api/verify/pan
// and by /api/host/payout-methods when a host edits their bank or PAN --
// so every change to either goes through SurePass, whichever screen made it.

export const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const ACCOUNT_RE = /^\d{9,18}$/;
export const PAN_RE = /^[A-Z]{5}\d{4}[A-Z]$/;

const BANK_VERIFICATION_ENDPOINT = "/api/v1/bank-verification/";
const PAN_COMPREHENSIVE_ENDPOINT = "/api/v1/pan/pan-comprehensive";

export type BankVerificationResult =
  | {
      verified: true;
      accountHolderName: string | null;
      upiId: string | null;
      bankName: string | null;
      branch: string | null;
      providerReference: string | null;
    }
  | { verified: false; reason: string | null };

export async function verifyBankAccount(
  userId: string,
  accountNumber: string,
  ifsc: string,
): Promise<BankVerificationResult> {
  if (!isSurepassConfigured()) {
    return { verified: false, reason: "Bank verification is not configured yet (missing SUREPASS_API_KEY)." };
  }

  const logAttempt = (params: { status: string; providerReference: string | null; errorMessage: string | null }) =>
    logKycRequest({
      userId,
      serviceType: "bank",
      maskedId: maskMiddle(accountNumber),
      status: params.status,
      providerReference: params.providerReference,
      errorMessage: params.errorMessage,
    });

  const res = await surepassPost(BANK_VERIFICATION_ENDPOINT, {
    id_number: accountNumber,
    ifsc,
    ifsc_details: true,
  });
  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json?.success) {
    console.error("[kycVerify] bank error:", res.status, json);
    const reason = json?.message || `Verification provider error (${res.status}).`;
    await logAttempt({ status: "failed", providerReference: null, errorMessage: reason });
    return { verified: false, reason };
  }

  const data = (json.data ?? {}) as Record<string, unknown>;
  const ifscDetails = (data.ifsc_details as Record<string, unknown> | undefined) ?? {};
  const providerReference = typeof data.client_id === "string" ? data.client_id : null;
  const verified = data.account_exists === true;
  const reason = verified
    ? null
    : (typeof data.remarks === "string" && data.remarks) || "Could not verify that bank account.";
  const bankName = (ifscDetails.bank_name ?? ifscDetails.bank ?? null) as string | null;

  const kycRequestId = await logAttempt({
    status: verified ? "success" : "failed",
    providerReference,
    errorMessage: reason,
  });
  if (kycRequestId) {
    await supabaseAdmin.from("bank_verifications").insert({
      kyc_request_id: kycRequestId,
      account_hash: sha256Hex(accountNumber),
      account_last4: accountNumber.slice(-4),
      ifsc_code: ifsc,
      account_holder_name: data.full_name ?? null,
      bank_name: bankName,
      is_valid: verified,
    });
  }

  if (!verified) return { verified: false, reason };

  // Keep the host's bank profile (host_bank_details) in step.
  const { data: hostRow } = await supabaseAdmin
    .from("host")
    .select("host_uuid")
    .eq("user_id", userId)
    .maybeSingle();
  if (hostRow?.host_uuid) {
    const { upsertHostBankDetails } = await import("@/lib/services/hostBankDetails");
    await upsertHostBankDetails({
      hostUuid: hostRow.host_uuid,
      accountName: typeof data.full_name === "string" ? data.full_name : null,
      accountNumber,
      ifsc,
      branchName: typeof ifscDetails.branch === "string" ? ifscDetails.branch : null,
      upiId: typeof data.upi_id === "string" ? data.upi_id : null,
    });
  }

  return {
    verified: true,
    accountHolderName: typeof data.full_name === "string" ? data.full_name : null,
    upiId: typeof data.upi_id === "string" ? data.upi_id : null,
    bankName,
    branch: typeof ifscDetails.branch === "string" ? ifscDetails.branch : null,
    providerReference,
  };
}

export type PanVerificationResult = {
  status: "verified" | "rejected" | "pending";
  reason: string | null;
  providerReference: string | null;
  fullName: string | null;
};

export async function verifyPanNumber(userId: string, pan: string): Promise<PanVerificationResult> {
  if (!isSurepassConfigured()) {
    return {
      status: "pending",
      reason: "Identity verification is not configured yet (missing SUREPASS_API_KEY).",
      providerReference: null,
      fullName: null,
    };
  }

  const res = await surepassPost(PAN_COMPREHENSIVE_ENDPOINT, { id_number: pan });
  const json = await res.json().catch(() => ({}));

  let status: "verified" | "rejected";
  let reason: string | null = null;
  let providerReference: string | null = null;
  let data: Record<string, unknown> | null = null;

  if (!res.ok || !json?.success) {
    console.error("[kycVerify] pan error:", res.status, json);
    status = "rejected";
    reason = json?.message || "Could not verify that PAN.";
  } else {
    data = (json.data ?? {}) as Record<string, unknown>;
    status = "verified";
    providerReference = typeof data.client_id === "string" ? data.client_id : null;
  }

  const kycRequestId = await logKycRequest({
    userId,
    serviceType: "pan",
    maskedId: maskMiddle(pan),
    status,
    providerReference,
    errorMessage: reason,
  });
  if (kycRequestId) {
    await supabaseAdmin.from("pan_verifications").insert({
      kyc_request_id: kycRequestId,
      pan_number_masked: maskMiddle(pan),
      full_name: data?.full_name ?? null,
      aadhaar_seeding_status: typeof data?.aadhaar_linked === "boolean" ? String(data.aadhaar_linked) : null,
      is_valid: status === "verified",
    });
  }

  return {
    status,
    reason,
    providerReference,
    fullName: typeof data?.full_name === "string" ? data.full_name : null,
  };
}
