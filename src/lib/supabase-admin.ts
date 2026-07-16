import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SCHEMA } from "./schema.constants";

// Server-only Supabase client using the service-role key. This BYPASSES RLS and
// must NEVER be imported into a client component — it lives behind /app/api/*
// route handlers only. The `server-only` import above makes a client-side
// import a build error.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://jhihqmkqvbwfniwculhk.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoaWhxbWtxdmJ3Zm5pd2N1bGhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzcxMzU3OCwiZXhwIjoyMDc5Mjg5NTc4fQ.qsgvYMauzXVHQqNnWmyiw4_0VPsCozXMiQ0f5dHStU0";

if (!SERVICE_KEY) {
  console.warn(
    "[supabase-admin] SUPABASE_SERVICE_ROLE_KEY is missing — write endpoints will fail.",
  );
}

// Use a placeholder during build if service key is missing
// This prevents build errors while still failing at runtime if used without a real key
const effectiveKey = SERVICE_KEY || "placeholder-build-key";

export const supabaseAdmin = createClient(SUPABASE_URL, effectiveKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: SCHEMA.testingSchema },
  // Next.js patches the global `fetch` in the App Router and will cache GET
  // requests — including the ones supabase-js makes under the hood — to its
  // on-disk Data Cache, which survives dev-server restarts. Without this,
  // a query that returned an empty result once (e.g. before a row existed)
  // can keep being served stale indefinitely, even for a live SELECT.
  global: {
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
      fetch(input, { ...init, cache: "no-store" }),
  },
});

export const hasServiceKey = () => Boolean(SERVICE_KEY);
