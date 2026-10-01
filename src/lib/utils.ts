import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** yyyy-mm-dd in local time. Never use `date.toISOString()` for this, it
 * converts to UTC first, which silently shifts the date back a day in any
 * timezone ahead of UTC (e.g. IST). */
export function toISODate(d: Date | null): string | null {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Password strength rule, shared by the settings form and the API: 8-72
 * characters (bcrypt's limit), at least one letter and one number, and not a
 * single repeated character. Returns an error message, or null when OK.
 */
export function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (pw.length > 72) return "Password must be 72 characters or fewer.";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Use at least one letter and one number.";
  if (/^(.)\1+$/.test(pw)) return "Choose a less predictable password.";
  return null;
}

/**
 * Sanitises a post-sign-in destination taken from the URL (`?redirect=`,
 * `?next=`). Only same-origin relative paths are honoured -- a single leading
 * "/" not followed by another "/" or "\" -- so a crafted link on our own
 * domain can't bounce someone to a phishing page after they authenticate.
 */
export function safeRedirect(value: string | null | undefined, fallback = "/"): string {
  if (!value) return fallback;
  // Browsers strip tabs/newlines from URLs, so "/<TAB>/evil.com" would become
  // "//evil.com" -- reject control characters outright.
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  return /^\/(?![/\\])/.test(value) ? value : fallback;
}
