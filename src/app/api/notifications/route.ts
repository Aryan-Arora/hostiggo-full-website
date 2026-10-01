import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId, UnauthorizedError } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const fail = (err: unknown, what: string) => {
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
  console.error("[/api/notifications] error:", err);
  return NextResponse.json({ error: `Could not ${what}.` }, { status: 500 });
};

export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    return fail(err, "load notifications");
  }
}

/**
 * Mark notifications read: body `{ ids: number[] }` or `{ all: true }`.
 * Writes the same `is_read` column the app flips, and the resulting UPDATE
 * reaches every open app / website session over realtime.
 */
export async function PATCH(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);
    const body = await req.json().catch(() => ({}));
    const ids = Array.isArray(body?.ids)
      ? body.ids.map(Number).filter((n: number) => Number.isFinite(n) && n > 0)
      : [];
    if (!body?.all && ids.length === 0) {
      return NextResponse.json({ error: "Provide ids or all." }, { status: 400 });
    }
    let query = supabaseAdmin
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    if (!body?.all) query = query.in("id", ids);
    const { error } = await query;
    if (error) throw error;
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    return fail(err, "update notifications");
  }
}
