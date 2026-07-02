import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    // Fetch user from users table
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("name, email, phone, profile_pic_url")
      .eq("user_id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch host profile - SELECT EVERYTHING to debug
    const { data: hostData, error: hostError } = await supabaseAdmin
      .from("host")
      .select("*")
      .eq("user_id", userId)
      .limit(1);

    if (hostError) {
      console.error("[GET /api/host/profile-info] Host fetch error:", hostError);
      return NextResponse.json({ error: "Failed to fetch host info" }, { status: 500 });
    }

    if (!hostData || hostData.length === 0) {
      return NextResponse.json({ error: "Host profile not found" }, { status: 404 });
    }

    const host = hostData[0];
    console.log("[GET /api/host/profile-info] Raw host data:", host);
    console.log("[GET /api/host/profile-info] about field:", host.about);

    // Build response with the about field from host table
    const responseData = {
      name: user.name || "Host",
      email: user.email,
      phone: user.phone,
      avatar: user.profile_pic_url || "https://i.pravatar.cc/200?img=12",
      about: host.about || "",  // From host table
      isVerified: host.is_verified || false,
      stats: {
        rating: "No ratings",
        reviews: 0,
        listings: 0,
      },
    };

    return NextResponse.json({ data: responseData });
  } catch (err: any) {
    console.error("[GET /api/host/profile-info] Exception:", err);
    return NextResponse.json({ error: err?.message ?? "Failed" }, { status: 500 });
  }
}
