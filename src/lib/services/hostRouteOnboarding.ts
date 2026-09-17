import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  createLinkedAccount,
  createStakeholder,
  activateRouteProduct,
} from "@/lib/billing/razorpayRoute";

/**
 * The actual 3-step Route setup (Account -> Stakeholder -> Product
 * activation), shared by both /api/host/create-linked-account (a host
 * manually retrying/resuming onboarding) and
 * maybeAutoOnboardHostToRoute below (triggered automatically once
 * verification conditions are met, no separate authenticated call needed).
 * Idempotent/resumable: persists razorpay_account_id/razorpay_stakeholder_id
 * after each step so a failure partway through only retries what's left.
 */
export async function runRouteOnboarding(hostUuid: string, userId: string) {
  const { data: payout, error: payoutError } = await supabaseAdmin
    .from("host_payout_methods")
    .select(
      "account_holder_name, bank_account_number, bank_ifsc, pan_number, address_line1, city, state, postal_code, razorpay_account_id, razorpay_stakeholder_id, status",
    )
    .eq("host_uuid", hostUuid)
    .maybeSingle();
  if (payoutError) throw payoutError;
  if (!payout) {
    throw new Error("No payout details on file for this host yet.");
  }
  if (payout.razorpay_account_id && payout.razorpay_stakeholder_id && payout.status !== "rejected") {
    return { razorpayAccountId: payout.razorpay_account_id, status: payout.status };
  }

  const { data: userRow, error: userError } = await supabaseAdmin
    .from("users")
    .select("email, phone")
    .eq("user_id", userId)
    .maybeSingle();
  if (userError) throw userError;
  if (!userRow?.email || !userRow?.phone) {
    throw new Error("Host is missing an email or phone number required for Route onboarding.");
  }

  let accountId = payout.razorpay_account_id;
  let stakeholderId = payout.razorpay_stakeholder_id;

  if (!accountId) {
    const account = await createLinkedAccount({
      email: userRow.email,
      phone: userRow.phone,
      legalBusinessName: payout.account_holder_name,
      contactName: payout.account_holder_name,
      addressLine1: payout.address_line1,
      city: payout.city,
      state: payout.state,
      postalCode: payout.postal_code,
      referenceId: hostUuid,
    });
    accountId = account.id;
    await supabaseAdmin
      .from("host_payout_methods")
      .update({ razorpay_account_id: accountId, status: "onboarding", updated_at: new Date().toISOString() })
      .eq("host_uuid", hostUuid);
  }

  if (!stakeholderId) {
    const stakeholder = await createStakeholder(accountId, {
      name: payout.account_holder_name,
      email: userRow.email,
      panNumber: payout.pan_number,
      bankAccountNumber: payout.bank_account_number,
      bankIfsc: payout.bank_ifsc,
    });
    stakeholderId = stakeholder.id;
    await supabaseAdmin
      .from("host_payout_methods")
      .update({ razorpay_stakeholder_id: stakeholderId, updated_at: new Date().toISOString() })
      .eq("host_uuid", hostUuid);
  }

  const product = await activateRouteProduct(accountId);
  const finalStatus = product.activation_status === "activated" ? "active" : "onboarding";
  await supabaseAdmin
    .from("host_payout_methods")
    .update({ status: finalStatus, updated_at: new Date().toISOString() })
    .eq("host_uuid", hostUuid);

  return { razorpayAccountId: accountId, status: finalStatus };
}

/**
 * Called from inside the verification routes themselves
 * (/api/kyc/aadhaar, /api/verify/pan, /api/verify/bank) right after each
 * records a 'verified'/'success' result -- not exposed as its own HTTP
 * endpoint, so there's no separate auth check to add here: the caller
 * (whichever verification route just ran) already authenticated this
 * userId. Fully fail-soft by design: a verification response must never be
 * held up or fail because Route onboarding did.
 *
 * Fires the Route setup once BOTH are true:
 *   1. Bank account verified -- latest kyc_requests row for this user with
 *      service_type = 'bank' and status = 'success' (see /api/verify/bank).
 *   2. At least one ID proof verified -- aadhaar_kyc.status = 'verified'
 *      OR the latest kyc_requests row with service_type = 'pan' and
 *      status = 'verified' (see /api/kyc/aadhaar, /api/verify/pan).
 * Only ever acts on users who already have a host profile -- a guest
 * completing ordinary identity verification at login must never trigger
 * Razorpay account creation.
 */
export async function maybeAutoOnboardHostToRoute(userId: string): Promise<void> {
  try {
    const { data: hostRow } = await supabaseAdmin
      .from("host")
      .select("host_uuid")
      .eq("user_id", userId)
      .maybeSingle();
    if (!hostRow?.host_uuid) return;
    const hostUuid = hostRow.host_uuid;

    const { data: payout } = await supabaseAdmin
      .from("host_payout_methods")
      .select("razorpay_account_id, razorpay_stakeholder_id, status")
      .eq("host_uuid", hostUuid)
      .maybeSingle();
    // No bank details on file yet, or already fully onboarded -- nothing to do.
    if (!payout || (payout.razorpay_account_id && payout.razorpay_stakeholder_id && payout.status !== "rejected")) {
      return;
    }

    const { data: bankRequest } = await supabaseAdmin
      .from("kyc_requests")
      .select("status")
      .eq("user_id", userId)
      .eq("service_type", "bank")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (bankRequest?.status !== "success") return;

    const { data: aadhaar } = await supabaseAdmin
      .from("aadhaar_kyc")
      .select("status")
      .eq("user_id", userId)
      .maybeSingle();
    let idProofVerified = aadhaar?.status === "verified";

    if (!idProofVerified) {
      const { data: panRequest } = await supabaseAdmin
        .from("kyc_requests")
        .select("status")
        .eq("user_id", userId)
        .eq("service_type", "pan")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      idProofVerified = panRequest?.status === "verified";
    }
    if (!idProofVerified) return;

    await runRouteOnboarding(hostUuid, userId);
  } catch (err) {
    console.error(`[maybeAutoOnboardHostToRoute] failed for user ${userId}:`, err);
  }
}
