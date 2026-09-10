import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ensureHostProfile } from "@/lib/services/admin-writes";
import { getAuthenticatedUserId, UnauthorizedError } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

// Bank account: digits only, 9-18 characters -- covers the real range of
// Indian bank account number lengths (there's no single fixed length).
const ACCOUNT_NUMBER_RE = /^\d{9,18}$/;
// Standard IFSC format: 4 letters (bank code) + '0' + 6 alphanumeric (branch code).
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
// Standard PAN format: 5 letters + 4 digits + 1 letter.
const PAN_RE = /^[A-Z]{5}\d{4}[A-Z]$/;
const POSTAL_CODE_RE = /^\d{6}$/;

export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);
    const hostUuid = await ensureHostProfile(userId);

    const { data, error } = await supabaseAdmin
      .from("host_payout_methods")
      .select(
        "account_holder_name, bank_account_number, bank_ifsc, pan_number, address_line1, city, state, postal_code, status, created_at, updated_at",
      )
      .eq("host_uuid", hostUuid)
      .maybeSingle();
    if (error) throw error;

    // Mask the account number for display -- the full number was only ever
    // needed at submit time; nothing after that should render it in full.
    const masked = data
      ? { ...data, bank_account_number: `••••${data.bank_account_number.slice(-4)}` }
      : null;

    return NextResponse.json({ data: masked });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("[/api/host/payout-methods GET] error:", err);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);
    const hostUuid = await ensureHostProfile(userId);

    const body = await req.json();
    const accountHolderName = String(body?.accountHolderName ?? "").trim();
    const bankAccountNumber = String(body?.bankAccountNumber ?? "").replace(/\s+/g, "");
    const bankIfsc = String(body?.bankIfsc ?? "").trim().toUpperCase();
    const panNumber = String(body?.panNumber ?? "").trim().toUpperCase();
    const addressLine1 = String(body?.addressLine1 ?? "").trim();
    const city = String(body?.city ?? "").trim();
    const state = String(body?.state ?? "").trim();
    const postalCode = String(body?.postalCode ?? "").trim();

    if (accountHolderName.length < 2) {
      return NextResponse.json({ error: "Enter the account holder's full name." }, { status: 400 });
    }
    if (!ACCOUNT_NUMBER_RE.test(bankAccountNumber)) {
      return NextResponse.json({ error: "Enter a valid bank account number." }, { status: 400 });
    }
    if (!IFSC_RE.test(bankIfsc)) {
      return NextResponse.json({ error: "Enter a valid IFSC code (e.g. HDFC0001234)." }, { status: 400 });
    }
    if (!PAN_RE.test(panNumber)) {
      return NextResponse.json({ error: "Enter a valid PAN (e.g. ABCDE1234F)." }, { status: 400 });
    }
    if (!addressLine1 || !city || !state) {
      return NextResponse.json({ error: "Address, city and state are required." }, { status: 400 });
    }
    if (!POSTAL_CODE_RE.test(postalCode)) {
      return NextResponse.json({ error: "Enter a valid 6-digit postal code." }, { status: 400 });
    }

    // Editing an existing, already-onboarded method starts it over --
    // Razorpay's Account/Stakeholder objects (once that onboarding step
    // exists) would need to be recreated against the new details anyway,
    // so there's no "onboarding"/"active" status left to preserve here.
    const { error } = await supabaseAdmin.from("host_payout_methods").upsert(
      {
        host_uuid: hostUuid,
        account_holder_name: accountHolderName,
        bank_account_number: bankAccountNumber,
        bank_ifsc: bankIfsc,
        pan_number: panNumber,
        address_line1: addressLine1,
        city,
        state,
        postal_code: postalCode,
        status: "submitted",
        razorpay_account_id: null,
        razorpay_stakeholder_id: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "host_uuid" },
    );
    if (error) throw error;

    return NextResponse.json({ data: { status: "submitted" } });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("[/api/host/payout-methods POST] error:", err);
    return NextResponse.json({ error: "Could not save payout details." }, { status: 500 });
  }
}
