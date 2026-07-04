/**
 * iCal Sync Service Client
 * Integrates with the external iCal microservice to sync calendar feeds from Airbnb, Google Calendar, Booking.com, etc.
 * Service URL: https://ical-1-of1o.onrender.com (no auth required)
 */

export interface ICalRegisterPayload {
  listingId: string | number;
  icalUrl: string;
  action: "add" | "update" | "deactivate";
}

export interface ICalRegisterResponse {
  status: string;
  slotOffsetS: number;
}

export interface ICalHealthResponse {
  health: string;
}

export interface ICalCalendarEvent {
  date: string; // YYYY-MM-DD
  start?: string; // HH:MM:SS
  end?: string; // HH:MM:SS
  uid?: string; // Unique identifier from ICS
}

export interface ICalCalendarStatus {
  listingId: number;
  icalUrl: string;
  lastSyncedAt?: string;
  lastEtag?: string;
  slotOffsetS: number;
  events?: ICalCalendarEvent[];
}

const SERVICE_URL = process.env.NEXT_PUBLIC_ICAL_SERVICE_URL || "https://ical-1-of1o.onrender.com";

/**
 * Check if the iCal service is online
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${SERVICE_URL}/`, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });
    if (!response.ok) return false;
    const data = (await response.json()) as ICalHealthResponse;
    return data.health === "online";
  } catch (error) {
    console.error("[iCal] Health check failed:", error);
    return false;
  }
}

/**
 * Register or update a listing's iCal feed
 * @param listingId - The listing ID in Hostiggo
 * @param icalUrl - The iCal URL to sync (e.g., from Airbnb, Google Calendar, Booking.com)
 * @param action - "add" (register new), "update" (change URL), or "deactivate" (stop syncing)
 */
export async function registerListing(
  listingId: string | number,
  icalUrl: string,
  action: "add" | "update" | "deactivate" = "add",
): Promise<ICalRegisterResponse> {
  try {
    const payload: ICalRegisterPayload = {
      listingId: String(listingId),
      icalUrl,
      action,
    };

    const response = await fetch(`${SERVICE_URL}/sync/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`iCal registration failed: ${error || response.statusText}`);
    }

    const data = (await response.json()) as ICalRegisterResponse;
    return data;
  } catch (error) {
    console.error("[iCal] Registration failed:", error);
    throw error;
  }
}

/**
 * Deactivate a listing's iCal sync
 * @param listingId - The listing ID in Hostiggo
 */
export async function deactivateListing(listingId: string | number): Promise<void> {
  try {
    await registerListing(listingId, "", "deactivate");
  } catch (error) {
    console.error("[iCal] Deactivation failed:", error);
    throw error;
  }
}

/**
 * Get the current calendar sync status for a listing
 * This would require the iCal service to expose a status endpoint
 * For now, we track this at the Supabase level via icalLink and listing_calendar tables
 */
export async function getCalendarStatus(
  listingId: string | number,
): Promise<ICalCalendarStatus | null> {
  // TODO: Implement once iCal service exposes a GET /listings/{id} or similar status endpoint
  // For now, this is handled by fetching from Supabase
  console.log("[iCal] Status fetch for listing:", listingId);
  return null;
}

/**
 * Get parsed calendar events for a listing from the iCal service
 * This would require the iCal service to expose an events endpoint
 */
export async function getCalendarEvents(
  listingId: string | number,
): Promise<ICalCalendarEvent[]> {
  // TODO: Implement once iCal service exposes a GET /listings/{id}/events endpoint
  console.log("[iCal] Events fetch for listing:", listingId);
  return [];
}

