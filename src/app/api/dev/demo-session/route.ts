import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";
import { SCHEMA } from "@/lib/schema.constants";

// Dev-only helper for the "Continue as demo host (dev)" button
// (src/app/host/layout.tsx). That button used to only set local
// state/localStorage via AuthContext.signIn(), never establishing a real
// Supabase Auth session -- so getBearerToken() (src/lib/api.ts) had nothing
// to attach to authenticated API calls, and anything requiring real auth
// (KYC submission, listing creation, etc.) 401'd.
//
// This route uses the service-role client to set a known password on the
// demo host's auth.users row (idempotent -- safe to call repeatedly), then
// signs in as that user with the ANON client via signInWithPassword using
// their phone number (the demo user has no email on file, only a
// phone_confirmed_at row), and returns the resulting session tokens for the
// client to install with supabase.auth.setSession().
//
// Gated on NODE_ENV, same as the button itself, and 404s in production so
// this can never be reached outside local/dev use.
const DEMO_HOST_ID = "7701820c-50fe-4ee8-a4e6-e18068c1fb0b";
const DEMO_HOST_PHONE = "+919717347960";
// Not a secret worth protecting -- this whole route is dev-only and 404s in
// production. Only used to establish a throwaway local session.
const DEMO_HOST_PASSWORD = "hostiggo-demo-host-dev-only-2026";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      DEMO_HOST_ID,
      { password: DEMO_HOST_PASSWORD },
    );
    if (updateError) {
      return NextResponse.json(
        { error: `Failed to set demo host password: ${updateError.message}` },
        { status: 500 },
      );
    }

    // The demo host row already exists in auth.users (this route only ever
    // sets its password) and in the app's `host` table, but never went
    // through the normal sign-up path (the OTP/OAuth flows upsert a `users`
    // row on every verify -- see /api/users POST, called from
    // api.verifyOtp() and the auth callback) -- so `users` was missing a row
    // for it entirely. That made every endpoint that joins through `users`
    // (e.g. /api/host/profile-info) 404 with "User not found" even though
    // auth and the host profile were both fine. Upserting here mirrors what
    // a real sign-in would have done, and is a no-op once the row exists.
    // Must go through supabaseAdmin (service role) -- the app's own
    // `usersAPI.upsertUser` uses the anon client, which is subject to RLS
    // policies keyed on the caller's auth context, and a server route has no
    // browser session to satisfy them ("permission denied for table users").
    const { data: existingUser, error: existingUserError } = await supabaseAdmin
      .from("users")
      .select("user_id")
      .eq("user_id", DEMO_HOST_ID)
      .maybeSingle();
    if (existingUserError) {
      return NextResponse.json(
        { error: `Failed to check demo host user row: ${existingUserError.message}` },
        { status: 500 },
      );
    }
    if (!existingUser) {
      const { error: insertUserError } = await supabaseAdmin.from("users").insert({
        user_id: DEMO_HOST_ID,
        name: "Demo Host",
        email: "",
        phone: DEMO_HOST_PHONE,
        is_verified: true,
        is_active: true,
      });
      if (insertUserError) {
        return NextResponse.json(
          { error: `Failed to create demo host user row: ${insertUserError.message}` },
          { status: 500 },
        );
      }
    }

    // A plain anon client (not the shared singleton in src/lib/supabase.ts)
    // so this server-side sign-in never touches that client's own
    // persisted/localStorage session state.
    const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: SCHEMA.testingSchema },
    });

    const { data, error: signInError } = await anon.auth.signInWithPassword({
      phone: DEMO_HOST_PHONE,
      password: DEMO_HOST_PASSWORD,
    });
    if (signInError || !data.session) {
      return NextResponse.json(
        { error: `Failed to sign in demo host: ${signInError?.message ?? "no session"}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unknown error establishing demo session" },
      { status: 500 },
    );
  }
}
