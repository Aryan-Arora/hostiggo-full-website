import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const adminSecret = process.env.ADMIN_SECRET;
    
    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const limit = Math.min(Number(searchParams.get("limit") || "100"), 500);
    const offset = Number(searchParams.get("offset") || "0");
    const templateName = searchParams.get("template");

    let query = supabaseAdmin.from("message_log").select("*", { count: "exact" });

    if (status) {
      query = query.eq("status", status);
    }
    if (templateName) {
      query = query.eq("template_name", templateName);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[message-log] Query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      count,
      limit,
      offset,
      hasMore: (offset + limit) < (count || 0),
    });
  } catch (err: any) {
    console.error("[message-log] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const adminSecret = process.env.ADMIN_SECRET;
    
    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, error: errorMsg } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const update: Record<string, any> = {};
    if (status) update.status = status;
    if (errorMsg !== undefined) update.error = errorMsg;

    const { error } = await supabaseAdmin
      .from("message_log")
      .update(update)
      .eq("id", id);

    if (error) {
      console.error("[message-log] Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[message-log] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
