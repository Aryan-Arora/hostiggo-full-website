import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type NotificationChannel = "in_app" | "whatsapp" | "email" | "sms";
export type NotificationCategory = "bookings" | "account" | "marketing";

export interface UserNotificationPreferences {
  channels: Record<NotificationChannel, boolean>;
  categories: Record<NotificationCategory, boolean>;
}

const DEFAULT_PREFERENCES: UserNotificationPreferences = {
  channels: {
    in_app: true,
    whatsapp: true,
    email: false,
    sms: false,
  },
  categories: {
    bookings: true,
    account: true,
    marketing: false,
  },
};

export async function getNotificationPreferences(
  userId: string
): Promise<UserNotificationPreferences> {
  const { data, error } = await supabaseAdmin
    .from("notification_preferences")
    .select("channels, categories")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[notificationPreferences] Query error:", error);
    return DEFAULT_PREFERENCES;
  }

  if (!data) {
    return DEFAULT_PREFERENCES;
  }

  return {
    channels: data.channels ?? DEFAULT_PREFERENCES.channels,
    categories: data.categories ?? DEFAULT_PREFERENCES.categories,
  };
}

export async function updateNotificationPreferences(
  userId: string,
  updates: Partial<UserNotificationPreferences>
): Promise<UserNotificationPreferences> {
  const current = await getNotificationPreferences(userId);

  const updated: UserNotificationPreferences = {
    channels: { ...current.channels, ...(updates.channels ?? {}) },
    categories: { ...current.categories, ...(updates.categories ?? {}) },
  };

  const { error } = await supabaseAdmin
    .from("notification_preferences")
    .upsert(
      {
        user_id: userId,
        channels: updated.channels,
        categories: updated.categories,
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("[notificationPreferences] Update error:", error);
    throw error;
  }

  return updated;
}

export async function isChannelEnabled(
  userId: string,
  channel: NotificationChannel
): Promise<boolean> {
  const prefs = await getNotificationPreferences(userId);
  return prefs.channels[channel] ?? DEFAULT_PREFERENCES.channels[channel];
}

export async function isCategoryEnabled(
  userId: string,
  category: NotificationCategory
): Promise<boolean> {
  const prefs = await getNotificationPreferences(userId);
  return prefs.categories[category] ?? DEFAULT_PREFERENCES.categories[category];
}

export async function isNotificationAllowed(
  userId: string,
  channel: NotificationChannel,
  category: NotificationCategory
): Promise<boolean> {
  const [channelEnabled, categoryEnabled] = await Promise.all([
    isChannelEnabled(userId, channel),
    isCategoryEnabled(userId, category),
  ]);
  return channelEnabled && categoryEnabled;
}
