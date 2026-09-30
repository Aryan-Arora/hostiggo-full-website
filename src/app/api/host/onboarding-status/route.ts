import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { findHostUuid } from "@/lib/services/admin-writes";
import { getAuthenticatedUserId, UnauthorizedError } from "@/lib/auth-server";
import { fetchRouteProduct, RazorpayRouteError } from "@/lib/billing/razorpayRoute";

export const dynamic = "force-dynamic";

// Polls Razorpay for the host's Route product config and syncs
// host_payout_methods.status: 'activated' -> 'active', 'rejected' -> 'rejected',
// anything else stays 'onboarding'. Read-only for guests (never creates a host row).
export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);
    const hostUuid = await findHostUuid(userId);
    if (!hostUuid) {
      return NextResponse.json({ data: { status: "none", activationStatus: null, requirements: [] } });
    }

    const { data: payout, error } = await supabaseAdmin
      .from("host_payout_methods")
      .select("razorpay_account_id, razorpay_product_id, status")
      .eq("host_uuid", hostUuid)
      .maybeSingle();
    if (error) throw error;
    if (!payout) {
      return NextResponse.json({ data: { status: "none", activationStatus: null, requirements: [] } });
    }

    // Not yet created on Razorpay's side -- nothing to poll.
    if (!payout.razorpay_account_id || !payout.razorpay_product_id) {
      return NextResponse.json({
        data: { status: payout.status, activationStatus: null, requirements: [] },
      });
    }

    const product = await fetchRouteProduct(payout.razorpay_account_id, payout.razorpay_product_id);
    const activation = product.activation_status;
    const nextStatus =
      activation === "activated" ? "active" : activation === "rejected" ? "rejected" : "onboarding";

    if (nextStatus !== payout.status) {
      const { error: updateError } = await supabaseAdmin
        .from("host_payout_methods")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("host_uuid", hostUuid);
      if (updateError) throw updateError;
    }

    return NextResponse.json({
      data: {
        status: nextStatus,
        activationStatus: activation,
        requirements: product.requirements ?? [],
      },
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof RazorpayRouteError) {
      console.error("[/api/host/onboarding-status] Razorpay error:", err.status, err.razorpay);
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error("[/api/host/onboarding-status] error:", err);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
