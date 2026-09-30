import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";

type WhatsAppTemplate = "booking_confirmation_guest" | "booking_received_host";

const templateEnvNames: Record<WhatsAppTemplate, string> = {
  booking_confirmation_guest: "TWILIO_TEMPLATE_BOOKING_CONFIRMATION_GUEST_EN",
  booking_received_host: "TWILIO_TEMPLATE_BOOKING_RECEIVED_HOST_EN",
};

function normalizeWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

function maskWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length > 4 ? `***${digits.slice(-4)}` : "***";
}

async function createMessageLog(input: {
  to: string;
  template: WhatsAppTemplate;
  variables: Record<string, string>;
}) {
  const { data, error } = await supabaseAdmin
    .from("message_log")
    .insert({
      to_number: input.to,
      template_name: input.template,
      language_code: "en",
      status: "pending",
      context: { variables: input.variables },
      retry_count: 0,
    })
    .select("id")
    .single();
  if (error) {
    console.error("[whatsapp] failed to create message_log row:", error);
    return null;
  }
  return data.id as number;
}

async function updateMessageLog(
  id: number | null,
  update: { status: string; twilioSid?: string | null; error?: string | null },
) {
  if (id === null) return;
  const { error } = await supabaseAdmin
    .from("message_log")
    .update({
      status: update.status,
      twilio_sid: update.twilioSid ?? null,
      error: update.error ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) console.error(`[whatsapp] failed to update message_log ${id}:`, error);
}

export async function sendWhatsAppTemplate(input: {
  to: string | null;
  template: WhatsAppTemplate;
  variables: Record<string, string>;
}): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const contentSid = process.env[templateEnvNames[input.template]];
  const to = input.to ? normalizeWhatsAppNumber(input.to) : null;
  const messageLogId = await createMessageLog({
    to: to ?? input.to ?? "missing",
    template: input.template,
    variables: input.variables,
  });

  if (!accountSid || !authToken || !from || !contentSid) {
    await updateMessageLog(messageLogId, {
      status: "skipped",
      error: "Twilio configuration is incomplete.",
    });
    console.warn(`[whatsapp] skipped ${input.template}: Twilio is not fully configured.`);
    return;
  }
  if (!to) {
    await updateMessageLog(messageLogId, {
      status: "skipped",
      error: "Recipient has no valid phone number.",
    });
    console.warn(`[whatsapp] skipped ${input.template}: recipient has no valid phone number.`);
    return;
  }

  const body = new URLSearchParams({
    From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
    To: `whatsapp:${to}`,
    ContentSid: contentSid,
    ContentVariables: JSON.stringify(input.variables),
  });
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    },
  );

  const result = (await response.json().catch(() => ({}))) as {
    sid?: string;
    status?: string;
    code?: number;
    message?: string;
  };
  if (!response.ok) {
    const detail = `Twilio ${result.code ?? response.status}: ${result.message ?? "request failed"}`;
    await updateMessageLog(messageLogId, {
      status: "failed",
      twilioSid: result.sid,
      error: detail,
    });
    throw new Error(detail);
  }
  await updateMessageLog(messageLogId, {
    status: result.status ?? "queued",
    twilioSid: result.sid,
  });
  console.info(
    `[whatsapp] ${input.template} accepted for ${maskWhatsAppNumber(to)}: ${result.sid ?? "no-sid"} (${result.status ?? "unknown"})`,
  );
}