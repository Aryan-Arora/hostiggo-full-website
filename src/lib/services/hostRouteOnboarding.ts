import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  createLinkedAccount,
  createStakeholder,
  createRouteProduct,
  submitRouteSettlementDetails,
} from "@/lib/billing/razorpayRoute";

/**
 * The actual 4-step Route setup -- Account -> Stakeholder -> create Product
 * config -> submit settlement bank details against that product config --
 * verified against a real Razorpay test-mode account (bank details do NOT
 * go on the Stakeholder; they go in a separate step against the product
 * config's own id, see razorpayRoute.ts). Shared by both
 * /api/host/create-linked-account (a host manually retrying/resuming) and
 * maybeAutoOnboardHostToRoute below (automatic trigger, no separate
 * authenticated call needed). Idempotent/resumable: persists each id right
 * after it's returned, so a failure partway through only retries what's
 * left -- including step 4 alone, which is the one expected to need
 * retrying in practice (Razorpay penny-tests the bank account and will
 * reject a wrong number/IFSC after a delay, well after this function has
 * already returned).
 */
export async function runRouteOnboarding(hostUuid: string, userId: string) {
  const { data: payout, error: payoutError } = await supabaseAdmin
    .from("host_payout_methods")
    .select(
      "account_holder_name, bank_account_number, bank_ifsc, pan_number, address_line1, city, state, postal_code, razorpay_account_id, razorpay_stakeholder_id, razorpay_product_id, status",
    )
    .eq("host_uuid", hostUuid)
    .maybeSingle();
  if (payoutError) throw payoutError;
  if (!payout) {
    throw new Error("No payout details on file for this host yet.");
  }
  if (
    payout.razorpay_account_id &&
    payout.razorpay_stakeholder_id &&
    payout.razorpay_product_id &&
    payout.status === "active"
  ) {
    return { razorpayAccountId: payout.razorpay_account_id, status: payout.status };
  }

  if (!payout.pan_number) {
    // Razorpay Route's stakeholder KYC needs a PAN -- payouts can't
    // activate without one.
    throw new Error("Add your PAN in Settings to finish payout setup -- Razorpay requires it.");
  }

  if (!payout.address_line1 || !payout.city || !payout.state || !payout.postal_code) {
    throw new Error("Add your address, city, state and postal code in Settings to finish payout setup -- Razorpay requires them.");
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
  let productId = payout.razorpay_product_id;

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
    });
    stakeholderId = stakeholder.id;
    await supabaseAdmin
      .from("host_payout_methods")
      .update({ razorpay_stakeholder_id: stakeholderId, updated_at: new Date().toISOString() })
      .eq("host_uuid", hostUuid);
  }

  if (!productId) {
    const product = await createRouteProduct(accountId);
    productId = product.id;
    await supabaseAdmin
      .from("host_payout_methods")
      .update({ razorpay_product_id: productId, updated_at: new Date().toISOString() })
      .eq("host_uuid", hostUuid);
  }

  const resolved = await submitRouteSettlementDetails(accountId, productId, {
    accountNumber: payout.bank_account_number,
    ifscCode: payout.bank_ifsc,
    beneficiaryName: payout.account_holder_name,
  });
  // 'needs_clarification' is the expected status right after submitting --
  // Razorpay penny-tests the account asynchronously and only reaches
  // 'activated' once that succeeds, which this function has no way to wait
  // for. See /api/host/onboarding-status for polling that.
  const finalStatus = resolved.activation_status === "activated" ? "active" : "onboarding";
  await supabaseAdmin
    .from("host_payout_methods")
    .update({ status: finalStatus, updated_at: new Date().toISOString() })
    .eq("host_uuid", hostUuid);

  return { razorpayAccountId: accountId, status: finalStatus };
}

/**
 * Called from inside the verification routes themselves
 * (/api/verify/pan, /api/verify/bank) right after each
 * records a 'verified'/'success' result -- not exposed as its own HTTP
 * endpoint, so there's no separate auth check to add here: the caller
 * (whichever verification route just ran) already authenticated this
 * userId. Fully fail-soft by design: a verification response must never be
 * held up or fail because Route onboarding did.
 *
 * Fires the Route setup once BOTH are true:
 *   1. Bank account verified -- latest kyc_requests row for this user with
 *      service_type = 'bank' and status = 'success' (see /api/verify/bank).
 *   2. PAN verified -- any kyc_requests row with service_type = 'pan'
 *      and status = 'verified' (see /api/verify/pan).
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

    // Any verified PAN counts, even if a later retry was rejected -- same
    // rule as /api/kyc/status and the payout-methods save check.
    const { data: verifiedPan } = await supabaseAdmin
      .from("kyc_requests")
      .select("id")
      .eq("user_id", userId)
      .eq("service_type", "pan")
      .eq("status", "verified")
      .limit(1)
      .maybeSingle();
    if (!verifiedPan) return;

    await runRouteOnboarding(hostUuid, userId);
  } catch (err) {
    console.error(`[maybeAutoOnboardHostToRoute] failed for user ${userId}:`, err);
  }
}
