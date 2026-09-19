import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId, UnauthorizedError } from "@/lib/auth-server";
import { ACCOUNT_RE, IFSC_RE, verifyBankAccount } from "@/lib/services/kycVerify";

export const dynamic = "force-dynamic";

// SurePass "Bank Verification" -- reverse penny-drop lookup keyed on the
// account number + IFSC (no penny actually debited, no OTP). The lookup
// itself lives in src/lib/services/kycVerify.ts, shared with the
// payout-methods edit flow.
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);

    const body = await req.json().catch(() => ({}));
    const accountNumber = String(body?.accountNumber ?? "").replace(/\s+/g, "");
    const ifsc = String(body?.ifsc ?? "").trim().toUpperCase();

    if (!ACCOUNT_RE.test(accountNumber)) {
      return NextResponse.json({ error: "Enter a valid bank account number." }, { status: 400 });
    }
    if (!IFSC_RE.test(ifsc)) {
      return NextResponse.json({ error: "Enter a valid IFSC code (e.g. HDFC0001234)." }, { status: 400 });
    }

    const result = await verifyBankAccount(userId, accountNumber, ifsc);
    if (!result.verified) {
      return NextResponse.json({ data: result });
    }

    // First of the two conditions needed to auto-onboard a host to
    // Razorpay Route may now be met -- see maybeAutoOnboardHostToRoute.
    // No-op for non-hosts or hosts missing the other condition; never
    // blocks this response.
    const { maybeAutoOnboardHostToRoute } = await import("@/lib/services/hostRouteOnboarding");
    await maybeAutoOnboardHostToRoute(userId);

    return NextResponse.json({ data: result });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("[api/verify/bank] unexpected error:", err);
    return NextResponse.json(
      { data: { verified: false, reason: "Verification failed unexpectedly. Please try again." } },
      { status: 200 },
    );
  }
}
