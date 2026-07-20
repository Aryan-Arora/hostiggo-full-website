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
    const body = (await req.json()) ?? {};
    if (!body.user_id || !body.name) {
      return NextResponse.json({ error: "user_id and name are required" }, { status: 400 });
    }
    // Whitelist the columns the onboarding flow actually owns -- passing the
    // raw body to .upsert() meant any extra key 500'd with "column not
    // found", and any users-table column could be written arbitrarily.
    const age = body.age == null ? null : Number(body.age);
    if (age != null && (!Number.isInteger(age) || age < 1 || age > 150)) {
      return NextResponse.json({ error: "age must be between 1 and 150" }, { status: 400 });
    }
    // Optional fields are only included when actually sent, so an upsert
    // that omits them can't null out values a previous save wrote.
    const data = await usersAPI.upsertUser({
      user_id: String(body.user_id),
      name: String(body.name).slice(0, 200),
      email: body.email ? String(body.email).slice(0, 320) : "",
      ...(body.phone !== undefined && { phone: body.phone ? String(body.phone).slice(0, 20) : null }),
      ...(body.age !== undefined && { age }),
      ...(body.emergency_contact !== undefined && {
        emergency_contact: body.emergency_contact
          ? String(body.emergency_contact).slice(0, 200)
          : null,
      }),
      ...(body.profile_pic_url !== undefined && {
        profile_pic_url: body.profile_pic_url ? String(body.profile_pic_url) : null,
      }),
      ...(body.is_verified !== undefined && { is_verified: body.is_verified === true }),
      ...(body.is_active !== undefined && { is_active: body.is_active === true }),
    });
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
