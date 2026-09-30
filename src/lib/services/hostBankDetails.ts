import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type HostBankDetailsInput = {
  hostUuid: string;
  accountName?: string | null;
  accountNumber?: string | null;
  ifsc?: string | null;
  branchName?: string | null;
  upiId?: string | null;
};

/**
 * Keeps host_bank_details (one row per host) in step with what the host
 * saved / what bank verification returned. host_payout_methods stays the
 * source for Razorpay Route onboarding; this table is the host's bank
 * profile. Only fields that are provided are written, so a verification
 * result that adds branch/UPI never blanks the account number. Fail-soft:
 * never blocks the calling route.
 */
export async function upsertHostBankDetails(input: HostBankDetailsInput): Promise<void> {
  try {
    const fields: Record<string, string> = {};
    if (input.accountName) fields.bank_account_name = input.accountName;
    if (input.accountNumber) fields.bank_account_number = input.accountNumber;
    if (input.ifsc) fields.bank_ifsc_code = input.ifsc;
    if (input.branchName) fields.bank_branch_name = input.branchName;
    if (input.upiId) fields.upi_id = input.upiId;
    if (Object.keys(fields).length === 0) return;

    const { data: existing, error: readErr } = await supabaseAdmin
      .from("host_bank_details")
      .select("id")
      .eq("host_uuid", input.hostUuid)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (readErr) throw readErr;

    if (existing) {
      const { error } = await supabaseAdmin.from("host_bank_details").update(fields).eq("id", existing.id);
      if (error) throw error;
      return;
    }

    // host_bank_details.id has no default in the schema, so allocate the next one.
    const { data: last } = await supabaseAdmin
      .from("host_bank_details")
      .select("id")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await supabaseAdmin
      .from("host_bank_details")
      .insert({ id: Number(last?.id ?? 0) + 1, host_uuid: input.hostUuid, ...fields });
    if (error) throw error;
  } catch (err) {
    console.error("[hostBankDetails] upsert failed:", err);
  }
}
