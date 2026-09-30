import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { validateTwilioSignature } from "@/lib/services/twilioWebhook";

/**
 * Twilio webhook for WhatsApp message status updates (sent, delivered, failed, etc.)
 * Configure this URL in Twilio Console → Messaging → WhatsApp senders → Status callback URL
 * URL: https://your-domain.com/api/webhooks/twilio
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const body = Object.fromEntries(formData.entries()) as Record<string, string>;

    // Validate Twilio signature for security
    const signature = request.headers.get("x-twilio-signature");
    const url = request.url;
    
    if (!validateTwilioSignature(signature, url, body)) {
      console.error("[twilio-webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const messageSid = body.MessageSid || body.SmsSid;
    const status = body.MessageStatus || body.SmsStatus;
    const errorCode = body.ErrorCode;
    const errorMessage = body.ErrorMessage;

    if (!messageSid || !status) {
      console.warn("[twilio-webhook] Missing MessageSid or status");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Update message_log with delivery status
    const update: Record<string, any> = { status };
    
    if (errorCode || errorMessage) {
      const existingError = await supabaseAdmin
        .from("message_log")
        .select("error")
        .eq("twilio_sid", messageSid)
        .maybeSingle();
      
      const errorDetail = errorCode 
        ? `Twilio ${errorCode}: ${errorMessage || "delivery failed"}` 
        : errorMessage || "delivery failed";
      
      // Append to existing error if present
      update.error = existingError?.data?.error 
        ? `${existingError.data.error}; ${errorDetail}` 
        : errorDetail;
    }

    const { error } = await supabaseAdmin
      .from("message_log")
      .update(update)
      .eq("twilio_sid", messageSid);

    if (error) {
      console.error(`[twilio-webhook] Failed to update message_log for ${messageSid}:`, error);
      return NextResponse.json({ error: "Database update failed" }, { status: 500 });
    }

    console.info(`[twilio-webhook] Updated ${messageSid} to status: ${status}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[twilio-webhook] Error processing webhook:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
