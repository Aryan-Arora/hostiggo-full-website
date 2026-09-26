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

  if (!payout.bank_account_number || !payout.bank_ifsc) {
    throw new Error("Add and verify your bank account in Settings to finish payout setup.");
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
  // Razorpay wants a bare 10-digit number -- stored phones may carry spaces,
  // dashes or a +91 / 0 prefix.
  const phone = String(userRow?.phone ?? "").replace(/\D/g, "").slice(-10);
  if (!userRow?.email || phone.length !== 10) {
    throw new Error("Add your email and a 10-digit phone number in Settings -> Personal Info to finish payout setup.");
  }

  let accountId = payout.razorpay_account_id;
  let stakeholderId = payout.razorpay_stakeholder_id;
  let productId = payout.razorpay_product_id;

  if (!accountId) {
    const account = await createLinkedAccount({
      email: userRow.email,
      phone,
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

export type VerifiedPayoutFields = {
  accountHolderName?: string | null;
  bankAccountNumber?: string | null;
  bankIfsc?: string | null;
  panNumber?: string | null;
};

/**
 * Copies details a host just verified (/api/verify/pan, /api/verify/bank)
 * into host_payout_methods, so Settings -> Payouts opens pre-filled and the
 * host only has to add their address. With no fields passed, it just
 * creates the row from the host's already-verified bank account
 * (host_bank_details), for hosts who verified before this existed.
 * The holder name is only filled in when none is saved yet. No-op for
 * non-hosts; fail-soft.
 */
export async function saveVerifiedPayoutDetails(userId: string, fields: VerifiedPayoutFields = {}): Promise<void> {
  try {
    const { data: hostRow } = await supabaseAdmin
      .from("host")
      .select("host_uuid")
      .eq("user_id", userId)
      .maybeSingle();
    if (!hostRow?.host_uuid) return;
    const hostUuid = hostRow.host_uuid;

    const { data: existing } = await supabaseAdmin
      .from("host_payout_methods")
      .select("account_holder_name, bank_account_number, bank_ifsc, pan_number")
      .eq("host_uuid", hostUuid)
      .maybeSingle();

    let { accountHolderName, bankAccountNumber, bankIfsc } = fields;
    if (!existing && !bankAccountNumber) {
      const { data: verifiedBank } = await supabaseAdmin
        .from("kyc_requests")
        .select("id")
        .eq("user_id", userId)
        .eq("service_type", "bank")
        .eq("status", "success")
        .limit(1)
        .maybeSingle();
      if (verifiedBank) {
        const { data: bank } = await supabaseAdmin
          .from("host_bank_details")
          .select("bank_account_name, bank_account_number, bank_ifsc_code")
          .eq("host_uuid", hostUuid)
          .order("id", { ascending: true })
          .limit(1)
          .maybeSingle();
        bankAccountNumber = bank?.bank_account_number ?? null;
        bankIfsc = bank?.bank_ifsc_code ?? null;
        accountHolderName ||= bank?.bank_account_name?.replace(/\s+/g, " ").trim() ?? null;
      }
    }

    const changes: Record<string, string> = {};
    const setIfChanged = (column: keyof NonNullable<typeof existing>, value: string | null | undefined) => {
      if (value && value !== existing?.[column]) changes[column] = value;
    };
    if (!existing?.account_holder_name) setIfChanged("account_holder_name", accountHolderName?.trim());
    setIfChanged("bank_account_number", bankAccountNumber);
    setIfChanged("bank_ifsc", bankIfsc);
    setIfChanged("pan_number", fields.panNumber);
    if (Object.keys(changes).length === 0) return;

    // Same as a Settings edit: new bank/PAN details start Route onboarding over.
    const reset = {
      status: "submitted",
      razorpay_account_id: null,
      razorpay_stakeholder_id: null,
      razorpay_product_id: null,
      updated_at: new Date().toISOString(),
    };
    if (existing) {
      const { error } = await supabaseAdmin
        .from("host_payout_methods")
        .update({ ...changes, ...reset })
        .eq("host_uuid", hostUuid);
      if (error) throw error;
    } else {
      // NOT NULL columns not known yet are stored empty, as in the Settings save.
      const { error } = await supabaseAdmin.from("host_payout_methods").insert({
        host_uuid: hostUuid,
        account_holder_name: "",
        bank_account_number: "",
        bank_ifsc: "",
        pan_number: "",
        address_line1: "",
        city: "",
        state: "",
        postal_code: "",
        ...changes,
        ...reset,
      });
      if (error) throw error;
    }
  } catch (err) {
    console.error(`[saveVerifiedPayoutDetails] failed for user ${userId}:`, err);
  }
}

/**
 * Called from inside the verification routes themselves
 * (/api/verify/pan, /api/verify/bank) right after each
 * records a 'verified'/'success' result -- not exposed as its own HTTP
 * endpoint, so there's no separate auth check to add here: the caller
 * (whichever verification route just ran) already authenticated this
 * userId. Fully fail-soft by design: a verification response must never be
 * held up or fail because Route onboarding did. Returns the failure
 * message (null if it succeeded or had nothing to do), so a caller that
 * wants to can show the host why payouts aren't set up yet.
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
export async function maybeAutoOnboardHostToRoute(userId: string): Promise<string | null> {
  try {
    const { data: hostRow } = await supabaseAdmin
      .from("host")
      .select("host_uuid")
      .eq("user_id", userId)
      .maybeSingle();
    if (!hostRow?.host_uuid) return null;
    const hostUuid = hostRow.host_uuid;

    const { data: payout } = await supabaseAdmin
      .from("host_payout_methods")
      .select("razorpay_account_id, razorpay_stakeholder_id, status")
      .eq("host_uuid", hostUuid)
      .maybeSingle();
    // No bank details on file yet, or already fully onboarded -- nothing to do.
    if (!payout || (payout.razorpay_account_id && payout.razorpay_stakeholder_id && payout.status !== "rejected")) {
      return null;
    }

    const { data: bankRequest } = await supabaseAdmin
      .from("kyc_requests")
      .select("status")
      .eq("user_id", userId)
      .eq("service_type", "bank")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (bankRequest?.status !== "success") return null;

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
    if (!verifiedPan) return null;

    await runRouteOnboarding(hostUuid, userId);
    return null;
  } catch (err) {
    console.error(`[maybeAutoOnboardHostToRoute] failed for user ${userId}:`, err);
    return err instanceof Error ? err.message : "Payout setup failed.";
  }
}
