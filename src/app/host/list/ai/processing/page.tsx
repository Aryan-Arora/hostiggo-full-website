'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import AiFlowShell from '../_components/AiFlowShell';
import { loadAiImportDraft, saveGeneratedListing, type AiGeneratedListing } from '../_lib/aiImportDraft';

type Outcome = 'loading' | 'success' | 'failure';

// There is no real scraping/AI-generation backend yet -- this simulates the
// call with a timeout and seeds a placeholder listing. Swap this function
// out for a real API call once one exists; nothing else in the flow needs
// to change (Review reads whatever saveGeneratedListing() wrote).
function simulateGeneration(): Promise<AiGeneratedListing> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        title: 'Mountain Retreat Villa',
        description:
          'A serene mountain getaway with panoramic views, modern amenities, and easy access to local trails. Perfect for families and groups looking for a peaceful escape.',
        numGuests: 6,
        numBedrooms: 3,
        numBeds: 4,
        numBathrooms: 2,
        amenityIds: [],
        priceWeekday: 4500,
        priceWeekend: 5800,
        photosImported: 18,
        amenitiesFound: 24,
        aiScore: 94,
      });
    }, 2200);
  });
}

function ProcessingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Debug-only affordance to view the failure state without a real backend
  // to actually fail against: /host/list/ai/processing?fail=1
  const forceFail = searchParams?.get('fail') === '1';

  const [outcome, setOutcome] = useState<Outcome>('loading');
  const [stats, setStats] = useState<AiGeneratedListing | null>(null);
  const [attempt, setAttempt] = useState(0);

  const run = useCallback(async () => {
    setOutcome('loading');
    const draft = loadAiImportDraft();
    const hasSourceUrl = draft.listings.some((l) => l.airbnbUrl.trim().length > 0);

    if (forceFail || !hasSourceUrl) {
      setOutcome('failure');
      return;
    }

    const generated = await simulateGeneration();
    saveGeneratedListing(generated);
    setStats(generated);
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
                Error: Unable to access listing at the provided URL. Please verify the link and
                try again.
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
