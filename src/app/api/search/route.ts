import { NextRequest, NextResponse } from "next/server";
import { HotelServiceApi } from "@/lib/services/hotel";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filters, page = 0, pageSize = 10 } = body;
    console.log("[/api/search] Received filters:", JSON.stringify(filters, null, 2));
    let data = await HotelServiceApi.filterHotels(filters, page, pageSize);
    console.log("[/api/search] Result count:", data?.length ?? 0);

    // Property type filter: the RPC's p_roomtypes doesn't reliably match the
    // real property_type_name values, so filter here against the RPC's own
    // returned property_type_name instead of trusting the RPC to do it.
    if (filters?.propertyTypes?.length && data?.length) {
      const wanted = new Set(filters.propertyTypes.map((t: string) => t.toLowerCase()));
      data = data.filter((r: any) =>
        wanted.has((r.listing?.property_type_name ?? "").toLowerCase()),
      );
    }

    // Stay type filter (Private room / Shared room / Entire property) —
    // same reasoning: filter on the real stay_type_title from the RPC row.
    if (filters?.stayTypes?.length && data?.length) {
      const wanted = new Set(filters.stayTypes.map((t: string) => t.toLowerCase()));
      data = data.filter((r: any) =>
        wanted.has((r.listing?.stay_type_title ?? "").toLowerCase()),
      );
    }

    // If date range provided, filter out listings that are unavailable.
    const { startDate, endDate } = filters ?? {};
    if (startDate && endDate && data?.length) {
      // RPC rows are shaped { listing: { listing_id, ... }, distance }
      const listingIds = data.map((r: any) => r.listing?.listing_id ?? r.listing_id).filter(Boolean);

      // Listings with at least one blocked calendar day in the range.
      const { data: blockedRows } = await supabaseAdmin
        .from("listing_calendar")
        .select("listing_id")
        .in("listing_id", listingIds)
        .gte("date", startDate)
        .lt("date", endDate)
        .eq("is_available", false);

      // Listings with a confirmed booking that overlaps the range.
      const { data: bookedRows } = await supabaseAdmin
        .from("bookings")
        .select("listing_id")
        .in("listing_id", listingIds)
        .eq("status_id", 2)
        .lt("start_date", endDate)
        .gt("end_date", startDate);

      const unavailable = new Set([
        ...(blockedRows ?? []).map((r: any) => r.listing_id),
        ...(bookedRows ?? []).map((r: any) => r.listing_id),
      ]);

      if (unavailable.size > 0) {
        data = data.filter((r: any) => !unavailable.has(r.listing?.listing_id ?? r.listing_id));
        console.log("[/api/search] After availability filter:", data.length, "unavailable:", unavailable.size);
      }
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("[/api/search] Error:", err.message, err.details ?? "");
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
