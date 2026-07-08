import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const listingId = Number(searchParams.get("listingId"));
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!listingId || !startDate || !endDate) {
    return NextResponse.json({ error: "listingId, startDate and endDate are required" }, { status: 400 });
  }

  // Check for blocked calendar days.
  const { data: blocked, error: blockedErr } = await supabaseAdmin
    .from("listing_calendar")
    .select("date")
    .eq("listing_id", listingId)
    .gte("date", startDate)
    .lt("date", endDate)
    .eq("is_available", false)
    .limit(1);

  if (blockedErr) {
    console.error("[check-availability] blocked-days query failed:", blockedErr);
    return NextResponse.json(
      { error: "Could not verify availability. Please try again." },
      { status: 500 },
    );
  }

  if (blocked && blocked.length > 0) {
    return NextResponse.json({ available: false, reason: "Some of the selected dates are not available." });
  }

  // Check for overlapping confirmed bookings.
  const { data: conflicts, error: conflictsErr } = await supabaseAdmin
    .from("bookings")
    .select("booking_id")
    .eq("listing_id", listingId)
    .eq("status_id", 2)
    .lt("start_date", endDate)
    .gt("end_date", startDate)
    .limit(1);

  if (conflictsErr) {
    console.error("[check-availability] conflicts query failed:", conflictsErr);
    return NextResponse.json(
      { error: "Could not verify availability. Please try again." },
      { status: 500 },
    );
  }

  if (conflicts && conflicts.length > 0) {
    return NextResponse.json({ available: false, reason: "These dates are already booked." });
  }

  return NextResponse.json({ available: true });
}
