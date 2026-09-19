// Server-only (used by /api routes); anon has no privileges on bookings.
import { supabaseAdmin as supabase } from "../supabase-admin";
import { SCHEMA } from "../schema.constants";

const DB_SCHEMA = SCHEMA.testingSchema;
const CALENDAR_TABLE = SCHEMA.tables.listingCalendar.tableName;
const CAL_COLS = SCHEMA.tables.listingCalendar.columns;

export interface CalendarEntryRow {
  calendar_id: number;
  listing_id: number;
  date: string;
  price: number;
  currency: string;
  is_available: boolean;
}

export interface BookingWithGuestRow {
  booking_id: number;
  start_date: string;
  end_date: string;
  status_id: number;
  amount: number;
  guest: { name: string } | null;
}

export interface CalendarUpsertPayload {
  listing_id: number;
  date: string;
  price: number;
  currency?: string;
  is_available: boolean;
  updated_at?: string;
}

export const calendarServiceAPI = {
  async fetchCalendarEntries(
    listingId: number,
    startDate: string,
    endDate: string,
  ): Promise<CalendarEntryRow[]> {
    const { data, error } = await supabase
      .schema(DB_SCHEMA)
      .from(CALENDAR_TABLE)
      .select(
        `
        ${CAL_COLS.calendarId},
        ${CAL_COLS.listingId},
        ${CAL_COLS.date},
        ${CAL_COLS.price},
        ${CAL_COLS.currency},
        ${CAL_COLS.isAvailable}
      `,
      )
      .eq(CAL_COLS.listingId, listingId)
      .gte(CAL_COLS.date, startDate)
      .lte(CAL_COLS.date, endDate)
      .order(CAL_COLS.date, { ascending: true });

    if (error) {
      console.error("[calendarService] fetchCalendarEntries error:", error);
      throw error;
    }

    return (data ?? []) as CalendarEntryRow[];
  },

  async fetchBookingsForListing(
    listingId: number,
    startDate: string,
    endDate: string,
  ): Promise<BookingWithGuestRow[]> {
    const { data, error } = await supabase
      .schema(DB_SCHEMA)
      .from("bookings")
      .select("booking_id, start_date, end_date, status_id, amount, user_id")
      .eq("listing_id", listingId)
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)
      .neq("status_id", 3)
      .order("start_date", { ascending: true });

    if (error) {
      console.error("[calendarService] fetchBookingsForListing error:", error);
      throw error;
    }

    if (!data || data.length === 0) return [];

    const userIds = [...new Set(data.map((b: any) => b.user_id).filter(Boolean))];
    const { data: users } = await supabase
      .schema(DB_SCHEMA)
      .from("users")
      .select("user_id, name")
      .in("user_id", userIds);

    const userMap = new Map((users ?? []).map((u: any) => [u.user_id, u.name]));

    return data.map((b: any) => ({
      booking_id: b.booking_id,
      start_date: b.start_date,
      end_date: b.end_date,
      status_id: b.status_id,
      amount: b.amount,
      guest: b.user_id ? { name: userMap.get(b.user_id) || "Guest" } : null,
    }));
  },

  async upsertCalendarEntry(payload: CalendarUpsertPayload) {
    const { data, error } = await supabase
      .schema(DB_SCHEMA)
      .from(CALENDAR_TABLE)
      .upsert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
