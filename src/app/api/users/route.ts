import { NextRequest, NextResponse } from "next/server";
import { usersAPI } from "@/lib/services/user";
import { updateUserProfile } from "@/lib/services/admin-writes";

export const dynamic = "force-dynamic";

const jsonError = (err: unknown, status = 500) =>
  NextResponse.json({ error: err instanceof Error ? err.message : "Request failed" }, { status });

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    const data = await usersAPI.getUserById(userId);
    return NextResponse.json({ data });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await usersAPI.upsertUser(await req.json());
    return NextResponse.json({ data });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, phone, token } = body;

    if (action === "update-profile") {
      if (!body.userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
      const data = await updateUserProfile(body.userId, body.patch ?? {});
      return NextResponse.json({ data });
    }

    if (action === "request-phone-change") {
      await usersAPI.requestPhoneChangeOtp(phone);
      return NextResponse.json({ data: true });
    }

    if (action === "verify-phone-change") {
      await usersAPI.verifyPhoneChangeOtp(phone, token);
      return NextResponse.json({ data: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return jsonError(err);
  }
}
