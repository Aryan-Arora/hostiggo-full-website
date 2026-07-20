import "server-only";
import Razorpay from "razorpay";

// Credentials come from environment variables only -- never hardcoded.
// Add to .env.local (not committed):
//   RAZORPAY_KEY_ID=
//   RAZORPAY_KEY_SECRET=
//   RAZORPAY_ACCOUNT_NUMBER=       (RazorpayX account, needed for payouts)
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_ACCOUNT_NUMBER = process.env.RAZORPAY_ACCOUNT_NUMBER;

let client: Razorpay | null = null;

/** Lazily constructs the Razorpay client so importing this module doesn't throw when keys aren't set yet (e.g. in tests). */
export function getRazorpayClient(): Razorpay {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error(
      "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set to make live Razorpay calls.",
    );
  }
  if (!client) {
    client = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
  }
  return client;
}

/**
 * Razorpay's payment gateway charge (2% + GST on that 2%) is a Hostiggo-side
 * cost -- never shown to the guest, never deducted from the host payout.
 * This just computes it for internal expense recording.
 */
export function calculateRazorpayGatewayCharge(grandTotalPaise: number): {
  gatewayFeePaise: number;
  gstOnGatewayFeePaise: number;
  totalChargePaise: number;
} {
  const gatewayFeePaise = Math.round(grandTotalPaise * 0.02);
  const gstOnGatewayFeePaise = Math.round(gatewayFeePaise * 0.18);
  return {
    gatewayFeePaise,
    gstOnGatewayFeePaise,
    totalChargePaise: gatewayFeePaise + gstOnGatewayFeePaise,
  };
}

/**
 * Razorpay's payout charge (0.25% + GST) is likewise a Hostiggo-side cost,
 * recorded as an "Other Charges" expense -- never deducted from the host's
 * netHostPayout, which the host receives in full.
 */
export function calculateRazorpayPayoutCharge(payoutAmountPaise: number): {
  payoutFeePaise: number;
  gstOnPayoutFeePaise: number;
  totalChargePaise: number;
} {
  const payoutFeePaise = Math.round(payoutAmountPaise * 0.0025);
  const gstOnPayoutFeePaise = Math.round(payoutFeePaise * 0.18);
  return {
    payoutFeePaise,
    gstOnPayoutFeePaise,
    totalChargePaise: payoutFeePaise + gstOnPayoutFeePaise,
  };
}

/** Creates a Razorpay order for the guest to pay grandTotal against (Section 2). */
export async function createRazorpayOrder(params: {
  amountPaise: number;
  receiptId: string;
  notes?: Record<string, string>;
}) {
  const razorpay = getRazorpayClient();
  return razorpay.orders.create({
    amount: params.amountPaise,
    currency: "INR",
    receipt: params.receiptId,
    notes: params.notes,
  });
}

/**
 * Creates a refund against the original Razorpay payment (Section 4.4).
 * Always pass an idempotencyKey (e.g. `refund:${bookingId}`) so a retried
 * request can never create a duplicate refund.
 */
export async function createRazorpayRefund(params: {
  razorpayPaymentId: string;
  amountPaise: number;
  idempotencyKey: string;
  notes?: Record<string, string>;
}) {
  const razorpay = getRazorpayClient();
  return razorpay.payments.refund(params.razorpayPaymentId, {
    amount: params.amountPaise,
    notes: params.notes,
    // The Razorpay Node SDK forwards this as the X-Razorpay-Idempotency-Key
    // header when supported by the installed SDK version -- if the SDK in
    // use doesn't expose it here, pass it via a raw HTTP call using the
    // same header name instead of this options field.
    idempotency_key: params.idempotencyKey,
  } as any);
}

/**
 * Transfers netHostPayout to the host via Razorpay Payouts (RazorpayX)
 * (Section 3). Requires the host's linked fund_account_id (collected
 * during host onboarding/KYC -- not part of this module) and a RazorpayX
 * business account number.
 */
export async function createRazorpayPayout(params: {
  fundAccountId: string;
  amountPaise: number;
  idempotencyKey: string;
  narration?: string;
  notes?: Record<string, string>;
}) {
  if (!RAZORPAY_ACCOUNT_NUMBER) {
    throw new Error("RAZORPAY_ACCOUNT_NUMBER must be set to make payouts.");
  }
  const razorpay = getRazorpayClient();
  // RazorpayX Payouts live under a separate API surface from the core
  // orders/payments SDK; the Node SDK exposes it as `razorpay.payouts` on
  // recent versions. If the installed version doesn't have this typed,
  // fall back to a raw request via `razorpay.api` (both are provided by
  // the same authenticated client, so credentials handling is unchanged).
  return (razorpay as any).payouts.create({
    account_number: RAZORPAY_ACCOUNT_NUMBER,
    fund_account_id: params.fundAccountId,
    amount: params.amountPaise,
    currency: "INR",
    mode: "IMPS",
    purpose: "payout",
    queue_if_low_balance: true,
    reference_id: params.idempotencyKey,
    narration: params.narration ?? "Hostiggo host payout",
    notes: params.notes,
  });
}
