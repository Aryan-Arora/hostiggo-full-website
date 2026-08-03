import { NextRequest, NextResponse } from "next/server";
import { HotelServiceApi } from "@/lib/services/hotel";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { SCHEMA } from "@/lib/schema.constants";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filters, cursor, pageSize: userPageSize } = body;
    
    // Clamp pageSize
    const pageSize = Math.min(100, Math.max(1, Math.floor(Number(userPageSize) || 50)));
    
    // Use cursor-based pagination for all searches (state, district, location)
    let data, hasMore, totalCount, stateBounds;
    const result = await HotelServiceApi.filterHotelsByState(
      filters,
      cursor || null,
      pageSize
    );
    data = result.data;
    hasMore = result.hasMore;
    totalCount = result.totalCount;
    stateBounds = result.stateBounds;

    // Property type filter
    if (filters?.propertyTypes?.length && data?.length) {
      const wanted = new Set(filters.propertyTypes.map((t: string) => t.toLowerCase()));
      data = data.filter((r: any) =>
        wanted.has((r.listing?.property_type_name ?? "").toLowerCase()),
      );
    }

    // Stay type filter
    if (filters?.stayTypes?.length && data?.length) {
      const wanted = new Set(filters.stayTypes.map((t: string) => t.toLowerCase()));
      data = data.filter((r: any) =>
        wanted.has((r.listing?.stay_type_title ?? "").toLowerCase()),
      );
    }

    // Date availability filter
    const { startDate, endDate } = filters ?? {};
    if (startDate && endDate && data?.length) {
      const listingIds = data.map((r: any) => r.listing?.listing_id ?? r.listing_id).filter(Boolean);

      const [
        { data: blockedRows, error: blockedErr },
        { data: bookedRows, error: bookedErr },
      ] = await Promise.all([
        supabaseAdmin
          .from("listing_calendar")
          .select("listing_id")
          .in("listing_id", listingIds)
          .gte("date", startDate)
          .lt("date", endDate)
          .eq("is_available", false),
        supabaseAdmin
          .from("bookings")
          .select("listing_id")
          .in("listing_id", listingIds)
          .eq("status_id", 2)
          .lt("start_date", endDate)
          .gt("end_date", startDate),
      ]);
      if (blockedErr) throw blockedErr;
      if (bookedErr) throw bookedErr;

      const unavailable = new Set([
        ...(blockedRows ?? []).map((r: any) => r.listing_id),
        ...(bookedRows ?? []).map((r: any) => r.listing_id),
      ]);

      if (unavailable.size > 0) {
        data = data.filter((r: any) => !unavailable.has(r.listing?.listing_id ?? r.listing_id));
      }
    }

    // Build response with cursor pagination info
    const response: any = { 
      data,
      cursor: data.length > 0 ? data[data.length - 1].listing?.listing_id : null,
      hasMore,
      totalCount,
    };
    
    if (stateBounds) {
      response.stateBounds = stateBounds;
    }

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("[/api/search] Error:", err.message, err.details ?? "");
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
