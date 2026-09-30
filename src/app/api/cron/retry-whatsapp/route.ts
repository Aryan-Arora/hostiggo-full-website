import { NextRequest, NextResponse } from "next/server";
import { retryFailedWhatsAppMessages } from "@/lib/services/whatsappRetry";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = await retryFailedWhatsAppMessages({
      maxRetries: 3,
      maxAgeHours: 24,
      limit: 100,
    });

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error("[retry-whatsapp] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
