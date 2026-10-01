// Pure (no I/O) off-platform contact detection for chat messages -- see
// postMessage/logModeration in src/lib/services/chat.ts.

const WORD_DIGITS: Record<string, string> = {
  zero: "0", oh: "0", one: "1", two: "2", three: "3", four: "4",
  five: "5", six: "6", seven: "7", eight: "8", nine: "9",
};

export function detectContactSharing(text: string): { blocked: boolean; reasons: string[]; sequence?: string } {
  const reasons: string[] = [];
  const lower = text.toLowerCase();

  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text)) reasons.push("email");
  if (/\b[a-z0-9._-]{2,}@(ok\w+|ybl|ibl|axl|paytm|upi|apl|icici|sbi|hdfcbank|axisbank)\b/i.test(text)) {
    reasons.push("upi");
  }
  if (/(wa\.me|whatsapp\.com|chat\.whatsapp|t\.me\/|telegram\.me|instagram\.com)/i.test(text)) {
    reasons.push("external_link");
  }

  // Phone numbers, including spaced/dashed and spelled-out digits
  // ("nine eight seven ...").
  const normalized = lower
    .replace(/\b(zero|oh|one|two|three|four|five|six|seven|eight|nine)\b/g, (w) => WORD_DIGITS[w])
    .replace(/[\s\-().+]/g, "");
  const phoneMatch = normalized.match(/(?:91|0)?[6-9]\d{9}/);
  if (phoneMatch) reasons.push("phone_number");

  return { blocked: reasons.length > 0, reasons, sequence: phoneMatch?.[0] };
}
