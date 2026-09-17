import "server-only";

// Route Linked Accounts: split each guest payment so a portion settles
// directly to the host, instead of Hostiggo receiving 100% and pushing a
// payout later. This is a DIFFERENT Razorpay product from the RazorpayX
// Payouts helpers in razorpay.ts (createRazorpayPayout) -- that path is not
// used for host settlement; Route is the model this app onboards hosts
// against (see host_payout_methods' own schema comments, written for Route
// from the start: razorpay_account_id / razorpay_stakeholder_id).
//
// Onboarding a host is a 3-step process against Razorpay's own API,
// authenticated with Hostiggo's own primary account credentials (the host
// never gets separate Razorpay API keys):
//   1. POST /v2/accounts                    -- create the Linked Account (acc_xxxxx)
//   2. POST /v2/accounts/{id}/stakeholders  -- attach the individual's KYC + bank details
//   3. POST /v2/accounts/{id}/products      -- activate the "route" product on it
// Called via raw REST (Basic Auth with RAZORPAY_KEY_ID/SECRET) rather than
// the `razorpay` npm SDK, same reasoning as createRazorpayPayout()'s
// fallback comment: Route's v2 accounts API isn't reliably typed across
// SDK versions, and a raw fetch is trivial to smoke-test with curl.
//
// IMPORTANT -- unverified against a live account: built from Razorpay's
// public Route API documentation, but this repo has never had Razorpay
// credentials available to test against (see billing/README.md), and Route
// specifically may not even be enabled/approved on this merchant account
// yet (a separate approval from having Orders/Payments working) -- confirm
// with Razorpay's account manager, then smoke-test each step against a
// real test-mode account before trusting this in production.

const RAZORPAY_API_BASE = "https://api.razorpay.com";
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export class RazorpayRouteError extends Error {
  constructor(
    message: string,
    public status: number,
    public razorpay: unknown,
  ) {
    super(message);
  }
}

function authHeader(): string {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set to call the Route API.");
  }
  return `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")}`;
}

async function routeRequest<T>(path: string, method: "POST" | "GET", body?: unknown): Promise<T> {
  const res = await fetch(`${RAZORPAY_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (json as any)?.error?.description || `Razorpay Route API error (${res.status})`;
    throw new RazorpayRouteError(message, res.status, json);
  }
  return json as T;
}

export type CreateLinkedAccountParams = {
  email: string;
  phone: string;
  legalBusinessName: string;
  contactName: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  /** Hostiggo's own host_uuid, so the Linked Account can be traced back to it from the Razorpay dashboard. */
  referenceId: string;
};

export type LinkedAccountResult = { id: string; status: string };

export async function createLinkedAccount(
  params: CreateLinkedAccountParams,
): Promise<LinkedAccountResult> {
  return routeRequest<LinkedAccountResult>("/v2/accounts", "POST", {
    email: params.email,
    phone: params.phone,
    type: "route",
    reference_id: params.referenceId,
    legal_business_name: params.legalBusinessName,
    business_type: "individual",
    contact_name: params.contactName,
    profile: {
      category: "hospitality",
      subcategory: "guest_house",
      addresses: {
        registered: {
          street1: params.addressLine1,
          street2: "",
          city: params.city,
          state: params.state,
          postal_code: params.postalCode,
          country: "IN",
        },
      },
    },
  });
}

export type CreateStakeholderParams = {
  name: string;
  email: string;
  panNumber: string;
  bankAccountNumber: string;
  bankIfsc: string;
};

export async function createStakeholder(
  accountId: string,
  params: CreateStakeholderParams,
): Promise<{ id: string }> {
  return routeRequest<{ id: string }>(`/v2/accounts/${accountId}/stakeholders`, "POST", {
    name: params.name,
    email: params.email,
    kyc: { pan: params.panNumber },
    bank_account: {
      ifsc_code: params.bankIfsc,
      beneficiary_name: params.name,
      account_number: params.bankAccountNumber,
    },
  });
}

export async function activateRouteProduct(
  accountId: string,
): Promise<{ id: string; activation_status: string }> {
  return routeRequest<{ id: string; activation_status: string }>(
    `/v2/accounts/${accountId}/products`,
    "POST",
    { product_name: "route", tnc_accepted: true },
  );
}

export type CreateTransferParams = {
  linkedAccountId: string;
  amountPaise: number;
  notes?: Record<string, string>;
};

export type CreateTransferResult = {
  items: Array<{ id: string; recipient_settlement_id: string | null; status: string }>;
};

// Splits a captured payment to the host's Linked Account. Call only after
// payment.captured is confirmed (see finalizeBookingFromRazorpayOrder in
// admin-writes.ts) -- never lets a Route failure block booking confirmation,
// since the guest's payment has already succeeded by this point.
export async function createTransferForPayment(
  paymentId: string,
  params: CreateTransferParams,
): Promise<CreateTransferResult> {
  return routeRequest<CreateTransferResult>(`/v1/payments/${paymentId}/transfers`, "POST", {
    transfers: [
      {
        account: params.linkedAccountId,
        amount: params.amountPaise,
        currency: "INR",
        notes: params.notes,
        on_hold: false,
      },
    ],
  });
}
