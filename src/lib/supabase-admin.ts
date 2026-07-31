import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SCHEMA } from "./schema.constants";

// Server-only Supabase client using the service-role key. This BYPASSES RLS and
// must NEVER be imported into a client component — it lives behind /app/api/*
// route handlers only. The `server-only` import above makes a client-side
// import a build error.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://jhihqmkqvbwfniwculhk.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!SERVICE_KEY) {
  console.warn(
    "[supabase-admin] SUPABASE_SERVICE_ROLE_KEY is missing — write endpoints will fail.",
  );
}

// createClient throws synchronously on an empty key, which would crash the
// server at import time (before any route's try/catch can run). Fall back to
// a placeholder so construction succeeds; requests will fail normally instead.
export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY || "missing-service-role-key", {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: SCHEMA.testingSchema },
});

export const hasServiceKey = () => Boolean(SERVICE_KEY);
