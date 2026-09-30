import "server-only";
import crypto from "crypto";

/**
 * Validates Twilio webhook signature to ensure requests are from Twilio.
 * See: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */
export function validateTwilioSignature(
  signature: string | null,
  url: string,
  params: Record<string, string>
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!authToken) {
    console.warn("[twilioWebhook] TWILIO_AUTH_TOKEN not configured, skipping signature validation");
    return true; // Allow in development if token not set
  }
  
  if (!signature) {
    return false;
  }

  // Sort params alphabetically and concatenate with URL
  const sortedKeys = Object.keys(params).sort();
  let data = url;
  for (const key of sortedKeys) {
    data += key + params[key];
  }

  // Compute HMAC-SHA1 signature
  const expectedSignature = crypto
    .createHmac("sha1", authToken)
    .update(Buffer.from(data, "utf-8"))
    .digest("base64");

  return signature === expectedSignature;
}
