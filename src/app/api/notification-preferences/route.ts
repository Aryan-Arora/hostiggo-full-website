import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId, UnauthorizedError } from "@/lib/auth-server";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type UserNotificationPreferences,
} from "@/lib/services/notificationPreferences";

export const dynamic = "force-dynamic";

// Same notification_preferences row the mobile app reads/writes, so a toggle on
// either side applies to both.

export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);
    const prefs = await getNotificationPreferences(userId);
    return NextResponse.json({ data: prefs });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("[notification-preferences] GET error:", err);
    return NextResponse.json({ error: "Could not load notification preferences." }, { status: 500 });
  }
}

const pickBooleans = (value: unknown): Record<string, boolean> => {
  const out: Record<string, boolean> = {};
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) if (typeof v === "boolean") out[k] = v;
  }
  return out;
};

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req);
    const body = await req.json().catch(() => ({}));
    const updated = await updateNotificationPreferences(userId, {
      channels: pickBooleans(body?.channels),
      categories: pickBooleans(body?.categories),
    } as Partial<UserNotificationPreferences>);
    return NextResponse.json({ data: updated });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("[notification-preferences] POST error:", err);
    return NextResponse.json({ error: "Could not save notification preferences." }, { status: 500 });
  }
}
