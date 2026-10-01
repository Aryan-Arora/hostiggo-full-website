import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppTemplate, type WhatsAppTemplate } from "@/lib/services/whatsapp";

const TEST_VARIABLES: Record<WhatsAppTemplate, Record<string, string>> = {
  booking_confirmation_guest: {
    "1": "Test Guest",
    "2": "Test Property",
    "3": "1 Oct 2026",
    "4": "2 Oct 2026",
    "5": "2",
    "6": "TEST-1",
  },
  booking_received_host: {
    "1": "Test Host",
    "2": "Test Property",
    "3": "Test Guest",
    "4": "1 Oct 2026",
    "5": "2 Oct 2026",
    "6": "2",
    "7": "TEST-1",
  },
};

/**
 * Manual WhatsApp send for debugging Twilio. Sends a real (billed) message to
 * any number, so it requires `Authorization: Bearer $CRON_SECRET`.
 *
 *   POST { phone: "+91...", template?: "booking_confirmation_guest" | "booking_received_host", variables?: {...} }
 *
 * A 200 only means Twilio accepted it -- delivery (or e.g. 63112) arrives
 * later via /api/webhooks/twilio-status and lands in message_log.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { phone, template = "booking_confirmation_guest", variables } = await req.json();
  if (!phone) {
    return NextResponse.json({ error: "Phone number required" }, { status: 400 });
  }
  if (!(template in TEST_VARIABLES)) {
    return NextResponse.json({ error: `Unknown template ${template}` }, { status: 400 });
  }
  try {
    await sendWhatsAppTemplate({
      to: phone,
      template: template as WhatsAppTemplate,
      variables: variables ?? TEST_VARIABLES[template as WhatsAppTemplate],
    });
    return NextResponse.json({ success: true, phone, template });
  } catch (err) {
    console.error("[test/whatsapp] Error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}
