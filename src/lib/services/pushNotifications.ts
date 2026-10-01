import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Server push to the mobile app via Expo's push service, so a host/guest gets
 * a phone notification even when the app is closed.
 *
 * Device tokens live in the user's auth `user_metadata.expo_push_tokens`
 * (written by the app on sign-in, removed on sign-out) -- no table needed.
 * The payload's `data` matches what the app's local notifications carry, so
 * tapping one deep-links the same way (DeviceNotificationBridge).
 *
 * Keep in step with hostiggo-frontend supabase/functions/_shared/push.ts.
 */

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
export const PUSH_TOKENS_KEY = "expo_push_tokens";

const isExpoToken = (t: unknown): t is string =>
  typeof t === "string" && /^Expo(nent)?PushToken\[.+\]$/.test(t);

export type PushInput = {
  userId: string;
  /** null when the user muted in-app: the push still deep-links via type + metadata. */
  notificationId: number | null;
  title: string;
  message: string;
  type: string | null;
  metadata: Record<string, unknown>;
};

/** Never throws -- a push failure must not undo a booking, payment or refund. */
export async function sendPush(input: PushInput): Promise<void> {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(input.userId);
    if (error || !data?.user) return;
    const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
    const raw = meta[PUSH_TOKENS_KEY];
    const tokens = Array.isArray(raw) ? [...new Set(raw.filter(isExpoToken))] : [];
    if (!tokens.length) return;

    const messages = tokens.map((to) => ({
      to,
      title: input.title,
      body: input.message,
      sound: "default",
      priority: "high",
      channelId: "important", // the app's HIGH-importance Android channel (heads-up)
      data: {
        tier: "important",
        source: "server",
        notificationId: input.notificationId,
        type: input.type,
        metadata: input.metadata,
      },
    }));

    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(process.env.EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}),
      },
      body: JSON.stringify(messages),
    });
    const body = (await res.json().catch(() => null)) as
      | { data?: { status: string; details?: { error?: string } }[] }
      | null;
    if (!res.ok) {
      console.error("[push] Expo push request failed:", res.status, body);
      return;
    }

    // Drop tokens for uninstalled apps so they don't pile up.
    const dead = tokens.filter((_, i) => body?.data?.[i]?.details?.error === "DeviceNotRegistered");
    if (dead.length) {
      await supabaseAdmin.auth.admin.updateUserById(input.userId, {
        user_metadata: { ...meta, [PUSH_TOKENS_KEY]: tokens.filter((t) => !dead.includes(t)) },
      });
    }
  } catch (err) {
    console.error("[push] failed to send push:", err);
  }
}
