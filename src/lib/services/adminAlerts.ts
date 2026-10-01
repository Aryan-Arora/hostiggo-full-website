import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Sends critical alerts to admin team when system issues occur
 */
export async function sendAdminAlert(input: {
  severity: "critical" | "warning" | "info";
  category: "whatsapp" | "payment" | "system";
  message: string;
  details?: Record<string, any>;
}): Promise<void> {
  try {
    // Log to console immediately
    const prefix = `[ADMIN ALERT ${input.severity.toUpperCase()}][${input.category}]`;
    console.error(prefix, input.message, input.details);

    // One row per incident, not per failed message: skip if the same alert is
    // already open from the last hour.
    const { data: open } = await supabaseAdmin
      .from("admin_alerts")
      .select("id")
      .eq("category", input.category)
      .eq("message", input.message)
      .is("resolved_at", null)
      .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .limit(1)
      .maybeSingle();
    if (open) return;

    // Store in database for admin dashboard
    const { error } = await supabaseAdmin.from("admin_alerts").insert({
      severity: input.severity,
      category: input.category,
      message: input.message,
      details: input.details || {},
      created_at: new Date().toISOString(),
    });
    if (error) console.error("[adminAlerts] Failed to store alert:", error);

    // TODO: Send email/Slack notification to admin team
    // TODO: Send SMS to on-call admin if critical
  } catch (err) {
    console.error("[adminAlerts] Failed to send alert:", err);
  }
}

/**
 * Check if WhatsApp has been failing consistently and alert admins
 */
export async function checkWhatsAppHealth(): Promise<void> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    // Check recent failure rate
    const { data: recentMessages } = await supabaseAdmin
      .from("message_log")
      .select("status, error")
      .gte("created_at", oneHourAgo)
      .limit(100);

    if (!recentMessages || recentMessages.length === 0) return;

    const failedCount = recentMessages.filter(m => m.status === "failed").length;
    const failureRate = failedCount / recentMessages.length;

    // Alert if >50% failure rate
    if (failureRate > 0.5) {
      const error63112Count = recentMessages.filter(m => 
        m.error?.includes("63112")
      ).length;

      if (error63112Count > 0) {
        await sendAdminAlert({
          severity: "critical",
          category: "whatsapp",
          message: `WhatsApp Business Account is disabled (Error 63112). ${failedCount}/${recentMessages.length} messages failed in the last hour.`,
          details: {
            failureRate: `${(failureRate * 100).toFixed(1)}%`,
            error63112Count,
            totalMessages: recentMessages.length,
            failedMessages: failedCount,
          },
        });
      } else {
        await sendAdminAlert({
          severity: "warning",
          category: "whatsapp",
          message: `High WhatsApp failure rate: ${failedCount}/${recentMessages.length} messages failed in the last hour.`,
          details: {
            failureRate: `${(failureRate * 100).toFixed(1)}%`,
            recentErrors: recentMessages
              .filter(m => m.status === "failed")
              .map(m => m.error)
              .slice(0, 5),
          },
        });
      }
    }
  } catch (err) {
    console.error("[checkWhatsAppHealth] Error:", err);
  }
}
