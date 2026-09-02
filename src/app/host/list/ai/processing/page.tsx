'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import AiFlowShell from '../_components/AiFlowShell';
import { loadAiImportDraft, saveGeneratedListing, type AiGeneratedListing } from '../_lib/aiImportDraft';

type Outcome = 'loading' | 'success' | 'failure';

// A job whose status is still 'queued'/'processing' after this many polls
// (~1.5s apart) is treated as failed rather than polled forever.
const MAX_POLLS = 30;
const POLL_INTERVAL_MS = 1500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Maps a real AI-lister job result onto this flow's AiGeneratedListing
 * shape. NOTE on the multi-listing case: only the first listing with a URL
 * is imported here -- the "Add Another" / batch-import UI on Setup exists,
 * but wiring N jobs through Review (which only ever edits one listing) is
 * a separate piece of work; multiMode still saves every URL to the draft
 * for whenever that's built.
 */
async function runRealImport(url: string): Promise<{ ok: true; listing: AiGeneratedListing } | { ok: false; error: string }> {
  const createRes = await fetch('/api/host/ai-import/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const createBody = await createRes.json().catch(() => ({}));
  if (!createRes.ok) {
    return { ok: false, error: createBody?.error || 'Could not start the import.' };
  }

  let job = createBody.data;
  let polls = 0;
  while ((job.status === 'queued' || job.status === 'processing') && polls < MAX_POLLS) {
    await sleep(POLL_INTERVAL_MS);
    const pollRes = await fetch(`/api/host/ai-import/jobs/${job.id}`);
    const pollBody = await pollRes.json().catch(() => ({}));
    if (!pollRes.ok) {
      return { ok: false, error: pollBody?.error || 'Lost track of the import job.' };
    }
    job = pollBody.data;
    polls += 1;
  }

  if (job.status !== 'succeeded' || !job.validated_draft) {
    return { ok: false, error: job.error || 'The source page could not be processed.' };
  }

  const draft = job.validated_draft;
  const successfulPhotos = (job.photos ?? []).filter((p: any) => p.public_url);

  return {
    ok: true,
    listing: {
      title: draft.title || 'Untitled listing',
      description: draft.description || '',
      numGuests: draft.capacity?.max_guests ?? 2,
      numBedrooms: draft.capacity?.bedrooms ?? 1,
      numBeds: draft.capacity?.beds ?? 1,
      numBathrooms: draft.capacity?.bathrooms ?? 1,
      // AI-lister's amenities are free-text strings from the source site;
      // mapping them onto this app's internal amenity_id enum isn't done
      // yet, so amenitiesFound below reflects the real count even though
      // amenityIds stays empty (same as the manual wizard leaves it until
      // a host picks amenities themselves).
      amenityIds: [],
      priceWeekday: draft.pricing?.nightly_amount ?? 0,
      priceWeekend: draft.pricing?.nightly_amount ?? 0,
      photosImported: successfulPhotos.length,
      amenitiesFound: draft.amenities?.length ?? 0,
      aiScore: job.coverage?.summary?.percent_prefilled ?? 0,
      photoUrls: successfulPhotos.map((p: any) => p.public_url as string),
    },
  };
}

function ProcessingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Debug-only affordance to view the failure state on demand:
  // /host/list/ai/processing?fail=1
  const forceFail = searchParams?.get('fail') === '1';

  const [outcome, setOutcome] = useState<Outcome>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [stats, setStats] = useState<AiGeneratedListing | null>(null);
  const [attempt, setAttempt] = useState(0);

  const run = useCallback(async () => {
    setOutcome('loading');
    const draft = loadAiImportDraft();
    const firstUrl = draft.listings.find((l) => l.airbnbUrl.trim().length > 0)?.airbnbUrl.trim();

    if (forceFail || !firstUrl) {
      setErrorMessage('No source URL was provided.');
      setOutcome('failure');
      return;
    }

    const result = await runRealImport(firstUrl);
    if (!result.ok) {
      setErrorMessage(result.error);
      setOutcome('failure');
      return;
    }
    saveGeneratedListing(result.listing);
    setStats(result.listing);
    setOutcome('success');
  }, [forceFail]);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  return (
    <AiFlowShell stage="processing" showBack={false}>
      <div className="flex items-center justify-center py-16">
        <div className="bg-white rounded-3xl shadow-card border border-gray-200 max-w-md w-full p-10 text-center">
          {outcome === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 text-figma-navy animate-spin mx-auto mb-6" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Generating your listing…</h2>
              <p className="text-sm text-gray-500">
                Our AI is reading the listing, importing photos, and detecting amenities. This
                usually takes under a minute.
              </p>
            </>
          )}

          {outcome === 'success' && stats && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Your listing is ready!</h2>
              <p className="text-sm text-gray-500 mb-6">
                The AI has successfully generated your property listing. Review all the details
                before publishing.
              </p>
              <div className="grid grid-cols-3 gap-3 mb-8">
                <div>
                  <p className="text-2xl font-extrabold text-gray-900">{stats.photosImported}</p>
                  <p className="text-xs text-gray-500">Photos imported</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-gray-900">{stats.amenitiesFound}</p>
                  <p className="text-xs text-gray-500">Amenities found</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-gray-900">{stats.aiScore}%</p>
                  <p className="text-xs text-gray-500">AI score</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push('/host/list/ai/review')}
                className="w-full py-3.5 bg-figma-navy hover:bg-figma-navy/90 text-white font-bold rounded-xl transition-all active:scale-[0.98] inline-flex items-center justify-center gap-1.5"
              >
                Review Listings →
              </button>
              <p className="text-xs text-gray-400 mt-3">
                You can edit any details before publishing.
              </p>
            </>
          )}

          {outcome === 'failure' && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Generation Failed</h2>
              <p className="text-sm text-gray-500 mb-4">
                We could not process your listing. The source URL may be invalid or the platform
                is temporarily unavailable.
              </p>
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-xs text-red-600 font-medium mb-6">
                Error: {errorMessage}
              </div>
              <button
                type="button"
                onClick={() => setAttempt((n) => n + 1)}
                className="w-full py-3.5 bg-figma-navy hover:bg-figma-navy/90 text-white font-bold rounded-xl transition-all active:scale-[0.98] mb-3"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => setAttempt((n) => n + 1)}
                className="text-sm font-bold text-figma-navy hover:underline"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    </AiFlowShell>
  );
}

export default function AiProcessingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFFEF9]" />}>
      <ProcessingContent />
    </Suspense>
  );
}
