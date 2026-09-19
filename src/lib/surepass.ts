import "server-only";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Server-only SurePass config. NEVER prefix these with NEXT_PUBLIC_ -- the
// API key must never reach the client bundle. Routes call SurePass directly
// (see src/app/api/verify/* and src/app/api/kyc/aadhaar) using this key --
// all of PAN, bank, passport, and Aadhaar are number-only lookups, no
// document photo upload required.
//
// Production only -- the account's sandbox environment has been retired, so
// every verify route calls kyc-api.surepass.app directly with a live token.
export const SUREPASS_BASE_URL = process.env.SUREPASS_BASE_URL || "https://kyc-api.surepass.app";
const SUREPASS_API_KEY = process.env.SUREPASS_API_KEY || "";

export const isSurepassConfigured = (): boolean => Boolean(SUREPASS_API_KEY);

export async function surepassPost(path: string, body: unknown): Promise<Response> {
  return fetch(`${SUREPASS_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUREPASS_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

// First 2 + last 2 characters visible, everything else starred -- enough to
// recognize the record without storing the full number. Same convention as
// aadhaar_kyc.aadhaar_last4 (display) + aadhaar_hash (dedupe).
export function maskMiddle(value: string): string {
  const v = value.trim();
  if (v.length <= 4) return "*".repeat(v.length);
  return `${v.slice(0, 2)}${"*".repeat(v.length - 4)}${v.slice(-2)}`;
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export type KycServiceType = "pan" | "passport" | "bank" | "aadhaar";

// Logs every verification attempt -- success or failure -- to kyc_requests
// so a rejection is debuggable and there's a record for compliance. Returns
// the new row's id so the caller can attach a per-type detail row, or null
// if logging itself failed (never blocks returning the result to the user).
export async function logKycRequest(params: {
  userId: string;
  serviceType: KycServiceType;
  maskedId: string | null;
  status: string;
  providerReference: string | null;
  errorMessage: string | null;
}): Promise<number | null> {
  const { data, error } = await supabaseAdmin
    .from("kyc_requests")
    .insert({
      user_id: params.userId,
      service_type: params.serviceType,
      masked_id: params.maskedId,
      status: params.status,
      provider_ref_id: params.providerReference,
      error_message: params.errorMessage,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[surepass] failed to log kyc_request:", error);
    return null;
  }
  return data.id as number;
}
