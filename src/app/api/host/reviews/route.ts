import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    const { data: host, error: hostErr } = await supabaseAdmin
      .from("host")
      .select("host_uuid")
      .eq("user_id", userId)
      .maybeSingle();
    if (hostErr) throw hostErr;
    if (!host?.host_uuid) return NextResponse.json({ data: [] });

    const { data: listings, error: listingsErr } = await supabaseAdmin
      .from("listings")
      .select("listing_id, title")
      .eq("host_uuid", host.host_uuid);
    if (listingsErr) throw listingsErr;

    const listingIds = (listings ?? []).map((l: any) => l.listing_id);
    if (listingIds.length === 0) return NextResponse.json({ data: [] });

    const listingTitles = new Map((listings ?? []).map((l: any) => [l.listing_id, l.title]));

    const { data: reviews, error: reviewsErr } = await supabaseAdmin
      .from("review")
      .select("review_id, listing_id, user_id, rating, comment, reviewd_at")
      .in("listing_id", listingIds)
      .order("reviewd_at", { ascending: false });
    if (reviewsErr) throw reviewsErr;

    const reviewerIds = [...new Set((reviews ?? []).map((r: any) => r.user_id))];
    const { data: reviewers, error: reviewersErr } =
      reviewerIds.length > 0
        ? await supabaseAdmin
            .from("users")
            .select("user_id, name, profile_pic_url")
            .in("user_id", reviewerIds)
        : { data: [], error: null };
    if (reviewersErr) throw reviewersErr;

    const reviewerMap = new Map((reviewers ?? []).map((u: any) => [u.user_id, u]));

    const data = (reviews ?? []).map((r: any) => {
      const reviewer = reviewerMap.get(r.user_id);
      return {
        id: String(r.review_id),
        rating: r.rating,
        comment: r.comment,
        reviewedAt: r.reviewd_at,
        listingTitle: listingTitles.get(r.listing_id) || "Listing",
        reviewerName: reviewer?.name?.trim() || "Guest",
        reviewerAvatar: reviewer?.profile_pic_url || null,
      };
    });

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("[GET /api/host/reviews] Exception:", err);
    return NextResponse.json({ error: err?.message ?? "Request failed" }, { status: 500 });
  }
}
