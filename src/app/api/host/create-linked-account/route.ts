import { NextRequest, NextResponse } from "next/server";
import { findHostUuid } from "@/lib/services/admin-writes";
import { runRouteOnboarding } from "@/lib/services/hostRouteOnboarding";
import { getAuthenticatedUserId, UnauthorizedError } from "@/lib/auth-server";
import { RazorpayRouteError } from "@/lib/billing/razorpayRoute";

export const dynamic = "force-dynamic";

// Manual fallback/retry for Route onboarding. Normal path is automatic --
// see maybeAutoOnboardHostToRoute() in hostRouteOnboarding.ts, triggered
// from inside /api/kyc/aadhaar, /api/verify/pan and /api/verify/bank as
// soon as a host has both a verified ID proof and a verified bank account,
// no separate call needed. This endpoint exists for a host stuck mid-way
// (e.g. a transient Razorpay error) to explicitly retry from wherever
// runRouteOnboarding's own idempotency left off.
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);
    // A retry only makes sense for an existing host with saved payout details;
    // it must never create the host row itself.
    const hostUuid = await findHostUuid(userId);
    if (!hostUuid) {
      return NextResponse.json({ error: "Save your payout details first." }, { status: 400 });
    }
    const result = await runRouteOnboarding(hostUuid, userId);
    return NextResponse.json({ data: result });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof RazorpayRouteError) {
      console.error("[api/host/create-linked-account] Razorpay error:", err.status, err.razorpay);
      return NextResponse.json(
        { error: err.message, razorpay: err.razorpay },
        { status: err.status >= 500 ? 502 : 400 },
      );
    }
    const message = err instanceof Error ? err.message : "Could not create your Razorpay linked account.";
    console.error("[api/host/create-linked-account] unexpected error:", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
