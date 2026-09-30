import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendWhatsAppTemplate } from "./whatsapp";

/**
 * Retry failed WhatsApp messages that have transient errors.
 * Non-retryable errors (63112 account disabled, invalid number, etc.) are skipped.
 * 
 * Usage: Call this from a cron job or scheduled task
 * Example: https://your-domain.com/api/cron/retry-whatsapp
 */

const RETRYABLE_ERROR_PATTERNS = [
  /timeout/i,
  /network/i,
  /connection/i,
  /temporary/i,
  /rate.?limit/i,
  /503/i,
  /502/i,
  /504/i,
  /429/i,
];

const NON_RETRYABLE_ERROR_CODES = [
  "63003", // Phone number is not formatted correctly
  "63004", // Invalid WhatsApp recipient number
  "63009", // Message body exceeds character limit
  "63016", // Invalid ContentSid
  "63112", // WhatsApp Business Account is disabled
];

function isRetryable(error: string | null): boolean {
  if (!error) return false;
  
  // Check for non-retryable error codes
  for (const code of NON_RETRYABLE_ERROR_CODES) {
    if (error.includes(code)) return false;
  }
  
  // Check for retryable error patterns
  return RETRYABLE_ERROR_PATTERNS.some(pattern => pattern.test(error));
}

export async function retryFailedWhatsAppMessages(options?: {
  maxRetries?: number;
  maxAgeHours?: number;
  limit?: number;
}): Promise<{ attempted: number; succeeded: number; failed: number; skipped: number }> {
  const maxRetries = options?.maxRetries ?? 3;
  const maxAgeHours = options?.maxAgeHours ?? 24;
  const limit = options?.limit ?? 100;
  
  const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();

  // Find failed messages that are retryable
  const { data: failedMessages, error: queryError } = await supabaseAdmin
    .from("message_log")
    .select("*")
    .eq("status", "failed")
    .gte("created_at", cutoffTime)
    .lt("retry_count", maxRetries)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (queryError) {
    console.error("[whatsappRetry] Query failed:", queryError);
    throw queryError;
  }

  if (!failedMessages || failedMessages.length === 0) {
    return { attempted: 0, succeeded: 0, failed: 0, skipped: 0 };
  }

  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  for (const msg of failedMessages) {
    // Skip non-retryable errors
    if (!isRetryable(msg.error)) {
      skipped++;
      await supabaseAdmin
        .from("message_log")
        .update({ 
          status: "skipped",
          error: `${msg.error} [non-retryable]`
        })
        .eq("id", msg.id);
      continue;
    }

    try {
      // Retry sending the message
      await sendWhatsAppTemplate({
        to: msg.to_number,
        template: msg.template_name as "booking_confirmation_guest" | "booking_received_host",
        variables: msg.context?.variables ?? {},
      });

      succeeded++;
      
      // Update retry count
      await supabaseAdmin
        .from("message_log")
        .update({ 
          retry_count: (msg.retry_count ?? 0) + 1,
          status: "queued", // Will be updated by webhook
          error: null
        })
        .eq("id", msg.id);
        
    } catch (err: any) {
      failed++;
      const retryCount = (msg.retry_count ?? 0) + 1;
      
      await supabaseAdmin
        .from("message_log")
        .update({ 
          retry_count: retryCount,
          status: retryCount >= maxRetries ? "failed" : "pending",
          error: `${msg.error}; Retry ${retryCount} failed: ${err.message}`
        })
        .eq("id", msg.id);
    }
  }

  console.info(
    `[whatsappRetry] Completed: ${succeeded} succeeded, ${failed} failed, ${skipped} skipped out of ${failedMessages.length} attempted`
  );

  return { 
    attempted: failedMessages.length, 
    succeeded, 
    failed, 
    skipped 
  };
}
