import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { WHATSAPP_ACCOUNT_DISABLED, whatsappStatusCallbackUrl } from "@/lib/services/whatsapp";

export const dynamic = "force-dynamic";

// Twilio calls this (StatusCallback, set per message in sendWhatsAppTemplate)
// every time a WhatsApp message changes status. The send API only ever says
// "queued" -- Meta rejects (e.g. 63112, account disabled) or delivers
// asynchronously afterwards, so without this message_log never learns the
// real outcome and failures are invisible.
export async function POST(req: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const url = whatsappStatusCallbackUrl();
  if (!authToken || !url) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const form = await req.formData();
  const params: Record<string, string> = {};
  form.forEach((value, key) => {
    if (typeof value === "string") params[key] = value;
  });

  // https://www.twilio.com/docs/usage/security#validating-requests
  // Signed over the exact URL we registered + the POST params sorted by name.
  const signed = url + Object.keys(params).sort().map((k) => k + params[k]).join("");
  const expected = crypto.createHmac("sha1", authToken).update(signed).digest("base64");
  const signature = req.headers.get("x-twilio-signature") ?? "";
  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    console.error("[/api/webhooks/twilio-status] signature mismatch -- rejecting");
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const sid = params.MessageSid;
  const status = params.MessageStatus;
  if (!sid || !status) return new NextResponse(null, { status: 204 });

  const errorCode = params.ErrorCode ? Number(params.ErrorCode) : null;
  const { data: row, error } = await supabaseAdmin
    .from("message_log")
    .update({
      status,
      // Same "Twilio <code>: ..." shape as send-time failures, so whatsappRetry
      // classifies both identically.
      ...(errorCode ? { error: `Twilio ${errorCode}: ${params.ErrorMessage ?? "delivery failed"}` } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("twilio_sid", sid)
    .select("id, template_name")
    .maybeSingle();
  if (error) console.error(`[/api/webhooks/twilio-status] failed to update message_log for ${sid}:`, error);

  if (errorCode === WHATSAPP_ACCOUNT_DISABLED) {
    const { sendAdminAlert } = await import("@/lib/services/adminAlerts");
    await sendAdminAlert({
      severity: "critical",
      category: "whatsapp",
      message: "WhatsApp Business Account disabled by Meta (Twilio 63112). WhatsApp notifications are not being delivered.",
      details: { twilioSid: sid, template: row?.template_name ?? null },
    });
  }

  return new NextResponse(null, { status: 204 });
}
