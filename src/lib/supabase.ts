import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://jhihqmkqvbwfniwculhk.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoaWhxbWtxdmJ3Zm5pd2N1bGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MTM1NzgsImV4cCI6MjA3OTI4OTU3OH0.b7AUBFdFMK0XJo8Q3xMzruma60vyj-4CgMrKFPgMenk";

if (!SUPABASE_ANON_KEY) {
  console.warn("[supabase] SUPABASE_ANON_KEY is missing — auth and DB calls will fail.");
}

// Next.js patches the global `fetch` in the App Router and will cache GET
// requests -- including the ones supabase-js makes under the hood -- to its
// on-disk Data Cache, which survives dev-server restarts. Without `cache:
// "no-store"` here, a query result (e.g. "popular locations") can keep being
// served stale indefinitely after the underlying rows change or get
// deleted, even on a `force-dynamic` route. Mirrors the same fix already
// applied to the service-role client in supabase-admin.ts.
const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  try {
    const response = await fetch(input, { ...init, cache: "no-store" });
    return response;
  } catch (error: any) {
    console.error("[supabase] Fetch Error:", {
      message: error.message,
      name: error.name,
      input,
    });
    throw error;
  }
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { fetch: customFetch },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: "hostiggo_testing_schema",
  },
});

// A second client, identical except it does NOT force `cache: "no-store"`.
// Only for reads that are already wrapped in `unstable_cache`
// (src/lib/services/cached-reference-data.ts) -- that wrapper is the actual
// caching/freshness layer (its own revalidate window), so the inner fetch
// forcing no-store was redundant there, and worse: a no-store fetch during
// Next's static-generation pass throws "Dynamic server usage", which broke
// the homepage in production (it couldn't be prerendered/ISR'd at all).
// Everywhere else in the app should keep using the `supabase` export above.
export const supabaseCacheable = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: "hostiggo_testing_schema",
  },
});

export { SUPABASE_URL, SUPABASE_ANON_KEY };
