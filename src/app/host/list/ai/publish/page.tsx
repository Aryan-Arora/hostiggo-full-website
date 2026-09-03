'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Rocket } from 'lucide-react';
import { useListingDraft } from '@/context/ListingDraftContext';
import AiFlowShell from '../_components/AiFlowShell';
import { clearAiImportDraft, clearGeneratedListing } from '../_lib/aiImportDraft';

export default function AiPublishPage() {
  const router = useRouter();
  const { draft, submit, submitting } = useListingDraft();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Nothing to publish (e.g. direct nav here without going through
    // Review) -- send them back to start.
    if (!draft.title) {
      router.replace('/host/list/ai/setup');
      return;
    }
    setChecked(true);
  }, [draft.title, router]);

  if (!checked) return null;

  const handlePublish = async () => {
    await submit();
    // submit() redirects to /host/listings on success and clears the
    // manual-wizard draft itself -- this just cleans up the AI-flow's own
    // local state so a later visit to /host/list/method starts fresh.
    clearAiImportDraft();
    clearGeneratedListing();
  };

  return (
    <AiFlowShell stage="publish" onBack={() => router.push('/host/list/ai/review')}>
      <div className="flex items-center justify-center py-16">
        <div className="bg-white rounded-3xl shadow-card border border-gray-200 max-w-md w-full p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-figma-navy/10 flex items-center justify-center mx-auto mb-5">
            <Rocket className="w-8 h-8 text-figma-navy" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to publish</h2>
          <p className="text-sm text-gray-500 mb-6">
            <span className="font-semibold text-gray-800">{draft.title}</span> will be submitted
            for review. It&apos;ll appear on Hostiggo once approved.
          </p>
          <button
            type="button"
            onClick={handlePublish}
            disabled={submitting}
            className="w-full py-3.5 bg-figma-navy hover:bg-figma-navy/90 text-white font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Publishing…' : 'Publish listing'}
          </button>
        </div>
      </div>
    </AiFlowShell>
  );
}
