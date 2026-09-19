import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type NotifyInput = {
  userId: string;
  title: string;
  message: string;
  /** Matches notification_preferences.categories: bookings | account | marketing. */
  type: "bookings" | "account" | "marketing";
  metadata?: Record<string, unknown>;
  templateId?: string | null;
};

/**
 * Writes an in-app notification row (the app reads `notifications` and
 * subscribes to it via realtime). Respects notification_preferences: skipped
 * if the user turned off in_app or that category. Never throws -- a
 * notification failure must not undo a payment, booking or refund.
 */
export async function notify(input: NotifyInput): Promise<void> {
  try {
    const { data: prefs } = await supabaseAdmin
      .from("notification_preferences")
      .select("channels, categories")
      .eq("user_id", input.userId)
      .maybeSingle();
    if (prefs?.channels?.in_app === false) return;
    if (prefs?.categories?.[input.type] === false) return;

    const { error } = await supabaseAdmin.from("notifications").insert({
      user_id: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      metadata: input.metadata ?? {},
      template_id: input.templateId ?? null,
    });
    if (error) throw error;
  } catch (err) {
    console.error("[notifications] failed to write notification:", err);
  }
}

/** Resolves a host_uuid to that host's auth user id for notifying them. */
export async function hostUserId(hostUuid: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("host")
    .select("user_id")
    .eq("host_uuid", hostUuid)
    .maybeSingle();
  return data?.user_id ?? null;
}
