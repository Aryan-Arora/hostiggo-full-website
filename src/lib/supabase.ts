import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://jhihqmkqvbwfniwculhk.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoaWhxbWtxdmJ3Zm5pd2N1bGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MTM1NzgsImV4cCI6MjA3OTI4OTU3OH0.b7AUBFdFMK0XJo8Q3xMzruma60vyj-4CgMrKFPgMenk";

if (!SUPABASE_ANON_KEY) {
  console.warn("[supabase] SUPABASE_ANON_KEY is missing — auth and DB calls will fail.");
}

const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  try {
    // Always read fresh. Next.js caches server-side `fetch` by default, which
    // otherwise serves stale Supabase reads (e.g. a listing list still showing
    // deleted rows, or a listing whose location/host was updated after the first
    // fetch). Booking data must be current, so opt out of the Data Cache.
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

export { SUPABASE_URL, SUPABASE_ANON_KEY };
