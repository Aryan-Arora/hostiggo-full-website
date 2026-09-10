import "server-only";

// Client for the AI-lister service (github.com/Hostiggo-Codebase/AI-lister),
// deployed separately on Railway -- see IMPORTER.md in that repo for the
// full pipeline. This app never calls its /commit endpoint: that writes to
// AI-lister's OWN minimal `public.listings` table (a different schema from
// this app's real hostiggo_testing_schema.listings), so publishing still
// goes through our own createListing() with whatever the host reviewed and
// edited -- see /host/list/ai/publish.

const AI_LISTER_URL = process.env.AI_LISTER_URL;

function requireBaseUrl(): string {
  if (!AI_LISTER_URL) {
    throw new Error("AI_LISTER_URL is not set -- the AI import backend isn't configured.");
  }
  return AI_LISTER_URL.replace(/\/+$/, "");
}

export type AiListerJob = {
  id: string;
  status: "queued" | "processing" | "succeeded" | "failed";
  stage: string;
  source_url: string;
  provider: string | null;
  tier_used: number | null;
  llm_model: string | null;
  validated_draft: {
    title: string | null;
    description: string | null;
    property_type: string | null;
    room_type: string | null;
    address: { line: string | null; city: string | null; state: string | null; country: string | null; postal_code: string | null };
    location: { lat: number | null; lng: number | null };
    capacity: { max_guests: number | null; bedrooms: number | null; beds: number | null; bathrooms: number | null };
    pricing: { nightly_amount: number | null; currency: string | null; cleaning_fee: number | null; weekly_discount_pct: number | null };
    amenities: string[];
    house_rules: string[];
    cancellation_policy: string | null;
    photos: { url: string; caption?: string | null }[];
  } | null;
  coverage: {
    summary: { auto: number; partial: number; manual: number; missing: number; required_unresolved: number; percent_prefilled: number };
  } | null;
  recommendations: { id: string; severity: string; field: string; title: string; detail: string }[];
  photos: { idx: number; original_url: string; public_url: string | null; status: string; error?: string | null }[];
  logs: { ts: string; stage: string; level: string; msg: string }[];
  error: string | null;
};

async function aiListerFetch(path: string, init?: RequestInit): Promise<any> {
  const base = requireBaseUrl();
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    // These are real network calls to another service -- never cache a
    // job's in-progress state as if it were static.
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error || `AI-lister request failed: ${res.status}`);
  }
  return body;
}

/** Creates a new import job for a single listing URL. */
export async function createImportJob(url: string): Promise<AiListerJob> {
  const body = await aiListerFetch("/api/import/jobs", {
    method: "POST",
    body: JSON.stringify({ url, consent: true }),
  });
  return body.job;
}

/**
 * Runs the pipeline for a job. In this deployment (confirmed live) this
 * resolves synchronously with the finished job -- no separate poll needed
 * for it to *start* processing, though a slow/JS-heavy source page can
 * still take a few seconds, which is why the caller still polls
 * getImportJob() afterward until status is no longer 'queued'/'processing'.
 */
export async function runImportWorker(jobId: string): Promise<AiListerJob> {
  const body = await aiListerFetch("/api/import/worker", {
    method: "POST",
    body: JSON.stringify({ jobId }),
  });
  return body.job;
}

/** Fetches the current state of a job, for polling. */
export async function getImportJob(jobId: string): Promise<AiListerJob> {
  const body = await aiListerFetch(`/api/import/jobs/${jobId}`);
  return body.job;
}
