import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  isImportantNotification,
  type NotificationCategory,
  type NotificationType,
} from "@/lib/notificationRules";
import { sendPush } from "./pushNotifications";
import type { WhatsAppTemplate } from "./whatsapp";

export type NotifyInput = {
  userId: string;
  title: string;
  message: string;
  /**
   * Canonical row type, shared with the DB triggers and the mobile app
   * (booking_guest | booking_host | host_onboarding | wishlist_nudge). It
   * drives tiering (instant vs delayed) and deep-linking on both clients.
   */
  type: NotificationType;
  /** notification_preferences.categories key this notification is gated by. */
  category: NotificationCategory;
  /** snake_case keys (booking_id, listing_id, role, ...) -- the app routes on these. */
  metadata?: Record<string, unknown>;
  /** notification_templates id; also the dedupe key against the DB triggers' rows. */
  templateId?: string | null;
};

/** A trigger row for the same event this recent is enriched instead of duplicated. */
const DEDUPE_WINDOW_MS = 15 * 60 * 1000;

/**
 * Delivers one notification on every channel the user allows, identically for
 * actions taken on the app or the website:
 *   - in-app row in `notifications` (app + website both read it over realtime)
 *   - phone push via Expo for important (booking / payment) types
 * WhatsApp is sent separately by notifyWhatsApp (it needs an approved template).
 *
 * Gating (same rule for every channel, see notification_preferences):
 *   categories[category] === false  -> nothing at all
 *   channels.in_app === false       -> no row
 *   channels.push === false         -> no phone push
 *
 * The DB triggers already write a row for booking insert (and, once the
 * payments-hardening migration is applied, cancel / refund / payout). When one
 * exists for the same user + template + booking, it is updated with this
 * (richer) copy rather than inserting a second row -- the UPDATE reaches both
 * clients over realtime.
 *
 * Never throws -- a notification failure must not undo a payment, booking or refund.
 */
export async function notify(input: NotifyInput): Promise<void> {
  try {
    const { data: prefs } = await supabaseAdmin
      .from("notification_preferences")
      .select("channels, categories")
      .eq("user_id", input.userId)
      .maybeSingle();
    if (prefs?.categories?.[input.category] === false) return;

    const metadata = { ...(input.metadata ?? {}) };
    const written = prefs?.channels?.in_app === false ? null : await writeInAppRow(input, metadata);

    if (isImportantNotification(input.type) && prefs?.channels?.push !== false) {
      await sendPush({
        userId: input.userId,
        notificationId: written?.id ?? null,
        title: input.title,
        message: input.message,
        type: input.type,
        metadata: written?.metadata ?? metadata,
      });
    }
  } catch (err) {
    console.error("[notifications] failed to deliver notification:", err);
  }
}

async function writeInAppRow(
  input: NotifyInput,
  metadata: Record<string, unknown>,
): Promise<{ id: number; metadata: Record<string, unknown> } | null> {
  try {
    const bookingId = metadata.booking_id;
    if (input.templateId && bookingId != null) {
      const { data: existing } = await supabaseAdmin
        .from("notifications")
        .select("id, metadata")
        .eq("user_id", input.userId)
        .eq("template_id", input.templateId)
        .eq("metadata->>booking_id", String(bookingId))
        .gte("created_at", new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing) {
        const merged = { ...(existing.metadata ?? {}), ...metadata };
        const { error } = await supabaseAdmin
          .from("notifications")
          .update({ title: input.title, message: input.message, metadata: merged })
          .eq("id", existing.id);
        if (error) throw error;
        return { id: existing.id, metadata: merged };
      }
    }

    const row = {
      user_id: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      metadata,
      template_id: input.templateId ?? null,
    };
    let { data: inserted, error } = await supabaseAdmin.from("notifications").insert(row).select("id").single();
    // template_id is a FK to notification_templates; a template from a
    // not-yet-applied migration must not cost the user their notification.
    if (error?.code === "23503" && row.template_id) {
      ({ data: inserted, error } = await supabaseAdmin
        .from("notifications")
        .insert({ ...row, template_id: null })
        .select("id")
        .single());
    }
    if (error) throw error;
    return inserted ? { id: inserted.id, metadata } : null;
  } catch (err) {
    console.error("[notifications] failed to write in-app notification:", err);
    return null;
  }
}

export async function notifyWhatsApp(input: {
  userId?: string | null;
  to: string | null | undefined;
  template: WhatsAppTemplate;
  variables: Record<string, string>;
  /** Same category gate as notify(); defaults to bookings. */
  category?: NotificationCategory;
}): Promise<void> {
  console.log(`[notifyWhatsApp] Called with userId: ${input.userId}, to: ${input.to}, template: ${input.template}`);
  
  try {
    // Check notification preferences if userId is provided
    if (input.userId) {
      const { data: prefs, error: prefsError } = await supabaseAdmin
        .from("notification_preferences")
        .select("channels, categories")
        .eq("user_id", input.userId)
        .maybeSingle();
      
      if (prefsError) {
        console.error(`[notifyWhatsApp] Failed to fetch preferences for user ${input.userId}:`, prefsError);
      }
      
      console.log(`[notifyWhatsApp] User ${input.userId} preferences:`, prefs);
      
      // Skip if WhatsApp is disabled for this user
      if (prefs?.channels?.whatsapp === false) {
        console.info(`[notifyWhatsApp] WhatsApp disabled for user ${input.userId}`);
        return;
      }
      
      // Skip if category is disabled (default to bookings if not specified)
      const category = input.category ?? "bookings";
      if (prefs?.categories?.[category] === false) {
        console.info(`[notifyWhatsApp] Category ${category} disabled for user ${input.userId}`);
        return;
      }
    }

    if (!input.to) {
      console.warn(`[notifyWhatsApp] No phone number provided for template ${input.template}`);
    }

    const { sendWhatsAppTemplate } = await import("./whatsapp");
    console.log(`[notifyWhatsApp] Calling sendWhatsAppTemplate with to: ${input.to}`);
    await sendWhatsAppTemplate({ to: input.to ?? null, template: input.template, variables: input.variables });
    console.log(`[notifyWhatsApp] Successfully sent ${input.template} to ${input.to}`);
  } catch (err) {
    console.error(`[notifyWhatsApp] WhatsApp delivery failed for template ${input.template}:`, err);
    console.error(`[notifyWhatsApp] Error details:`, {
      userId: input.userId,
      to: input.to,
      template: input.template,
      variables: input.variables,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    });
  }
}

export async function resolveUserPhone(userId: string, profilePhone?: string | null): Promise<string | null> {
  console.log(`[resolveUserPhone] Called for userId: ${userId}, profilePhone: ${profilePhone}`);
  
  if (profilePhone) {
    console.log(`[resolveUserPhone] Using profile phone: ${profilePhone}`);
    return profilePhone;
  }
  
  // Check auth.users for phone
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error) {
    console.error(`[resolveUserPhone] Error fetching auth.users for ${userId}:`, error);
  }
  
  const authPhone = data.user?.phone ?? null;
  console.log(`[resolveUserPhone] Auth phone for ${userId}: ${authPhone}`);
  
  return authPhone;
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
