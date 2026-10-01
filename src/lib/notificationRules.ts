/**
 * Notification rules shared by every surface that reads the `notifications`
 * table. This file MUST stay in step with the mobile app's copy in
 * hostiggo-frontend/src/shared/notifications/deviceNotifications.ts +
 * notificationRouting.ts -- both clients read the same rows over the same
 * realtime channel, so they have to agree on what a row means.
 *
 * Canonical row shape (set by the DB triggers and by notify() on the server):
 *   type      booking_guest | booking_host | host_onboarding | wishlist_nudge
 *   metadata  snake_case: booking_id, listing_id, property_id, role, ...
 *
 * Tiers:
 *   - important (bookings / payments / payouts): shown immediately, with a toast.
 *   - general (listing, onboarding, anything else): hidden for
 *     GENERAL_DELAY_SECONDS after creation, then shown quietly (no toast).
 *   - wishlist nudges: hidden for WISHLIST_DELAY_SECONDS.
 *   - host_onboarding: additionally hidden until its listing is actually live.
 */

export type NotificationType =
  | "booking_guest"
  | "booking_host"
  | "host_onboarding"
  | "wishlist_nudge"
  | (string & {});

export type NotificationCategory = "bookings" | "account" | "marketing";

export interface NotificationRow {
  id: number;
  user_id: string;
  template_id: string | null;
  title: string;
  message: string;
  type: NotificationType | null;
  metadata: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export const GENERAL_DELAY_SECONDS = 120;
export const WISHLIST_DELAY_SECONDS = 60 * 60;

const IMPORTANT_TYPES = new Set(["booking_guest", "booking_host", "bookings", "payment", "payout", "refund"]);
const LISTING_GATED_TYPES = new Set(["host_onboarding"]);

export const isImportantNotification = (type: string | null | undefined): boolean =>
  !!type && (IMPORTANT_TYPES.has(type) || type.startsWith("booking") || type.startsWith("pay"));

export const isListingGated = (type: string | null | undefined): boolean =>
  !!type && LISTING_GATED_TYPES.has(type);

/** Reads a metadata id, accepting legacy camelCase keys written before the contract was unified. */
const metaId = (meta: Record<string, unknown> | null | undefined, ...keys: string[]): number | null => {
  for (const k of keys) {
    const v = Number(meta?.[k]);
    if (Number.isFinite(v) && v > 0) return v;
  }
  return null;
};

export const bookingIdOf = (n: Pick<NotificationRow, "metadata">) => metaId(n.metadata, "booking_id", "bookingId");
export const listingIdOf = (n: Pick<NotificationRow, "metadata">) =>
  metaId(n.metadata, "listing_id", "property_id", "listingId");

export const gatedListingId = (n: Pick<NotificationRow, "type" | "metadata">): number | null =>
  isListingGated(n.type) ? listingIdOf(n) : null;

/** Seconds a notification of this type stays hidden after it was created. */
export const delaySecondsFor = (type: string | null | undefined): number => {
  if (isImportantNotification(type)) return 0;
  if (type && type.startsWith("wishlist")) return WISHLIST_DELAY_SECONDS;
  return GENERAL_DELAY_SECONDS;
};

export const isNotificationDue = (n: Pick<NotificationRow, "type" | "created_at">, now = Date.now()): boolean => {
  const delay = delaySecondsFor(n.type);
  if (delay === 0) return true;
  const created = n.created_at ? Date.parse(n.created_at) : NaN;
  if (!Number.isFinite(created)) return true;
  return now - created >= delay * 1000;
};

/** ms until the next not-yet-due notification becomes due, or null if none are pending. */
export const msUntilNextDue = (list: Pick<NotificationRow, "type" | "created_at">[], now = Date.now()): number | null => {
  let next: number | null = null;
  for (const n of list) {
    if (isNotificationDue(n, now)) continue;
    const wait = Math.max(0, Date.parse(n.created_at) + delaySecondsFor(n.type) * 1000 - now);
    next = next === null ? wait : Math.min(next, wait);
  }
  return next;
};

/** Website route for a notification (the app has its own equivalent in notificationRouting.ts). */
export function webRouteForNotification(n: Pick<NotificationRow, "type" | "metadata">): string | null {
  const bookingId = bookingIdOf(n);
  const listingId = listingIdOf(n);
  const role = n.metadata?.role;

  switch (n.type) {
    case "booking_guest":
      return bookingId ? `/booking-confirmation/${bookingId}` : "/my-memories";
    case "booking_host":
      return bookingId ? `/host/bookings/details?id=${bookingId}` : "/host/bookings";
    case "host_onboarding":
      return "/host/listings";
    case "wishlist_nudge":
      return listingId ? `/property/${listingId}` : "/wishlist";
    // Legacy rows written by the website before types were unified.
    case "bookings":
      if (bookingId) return role === "host" ? `/host/bookings/details?id=${bookingId}` : `/booking-confirmation/${bookingId}`;
      return null;
    case "account":
      return "/host/earnings";
  }
  return listingId ? `/property/${listingId}` : null;
}
