'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HelpCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useListingDraft } from '@/context/ListingDraftContext';

// Ordered list of the listing-creation wizard steps.
export const WIZARD_STEPS = [
  { slug: 'property-type', label: 'Property type' },
  { slug: 'location', label: 'Location' },
  { slug: 'capacity', label: 'Capacity' },
  { slug: 'amenities', label: 'Amenities' },
  { slug: 'addons', label: 'Add-ons' },
  { slug: 'photos', label: 'Photos' },
  { slug: 'details', label: 'Details' },
  { slug: 'pricing', label: 'Pricing' },
  { slug: 'house-rules', label: 'House rules' },
  { slug: 'verification', label: 'Verification' },
] as const;

export const WIZARD_TOTAL = WIZARD_STEPS.length;

export default function WizardShell({
  step,
  title,
  subtitle,
  children,
  nextLabel = 'Next',
  nextDisabled = false,
}: {
  step: number; // 1-based
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  const router = useRouter();
  const { submit, submitting } = useListingDraft();
  const idx = step - 1;
  const prev = WIZARD_STEPS[idx - 1];
  const next = WIZARD_STEPS[idx + 1];
  const progress = Math.round((step / WIZARD_TOTAL) * 100);

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f2f5] text-gray-800">
      {/* Top bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-12 h-20 bg-white shadow-nav">
        <Link
          href="/"
          className="text-xl font-extrabold tracking-tight text-gray-900"
        >
          HOSTI<span className="text-blue-600">GGO</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/host/listings"
            className="text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors px-4 py-2 rounded-lg"
          >
            Save &amp; Exit
          </Link>
          <Link
            href="/support"
            className="text-blue-600 hover:bg-blue-50 transition-colors p-2 rounded-full"
            aria-label="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Progress bar */}
      <div className="fixed top-20 left-0 w-full h-1 bg-gray-200 z-40">
        <div
          className="h-full bg-blue-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
        <span className="sr-only">
          Step {step} of {WIZARD_TOTAL}
        </span>
      </div>

      {/* Content */}
      <main className="flex-grow pt-32 pb-32 px-4 md:px-12 w-full">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2">
              Step {step} of {WIZARD_TOTAL}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-base md:text-lg text-gray-500 max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>
          {children}
        </div>
      </main>

      {/* Footer nav */}
      <footer className="fixed bottom-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-12 py-4 bg-white border-t border-gray-200">
        <button
          type="button"
          onClick={() => (prev ? router.push(`/host/list/${prev.slug}`) : router.back())}
          className="px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all active:scale-95"
        >
          Back
        </button>
        <div className="flex items-center gap-4">
          <Link
            href="/support"
            className="hidden md:block text-sm font-medium text-gray-500 hover:underline"
          >
            Need help?
          </Link>
          <button
            type="button"
            disabled={nextDisabled || submitting}
            aria-disabled={nextDisabled || submitting}
            onClick={() => {
              if (next) router.push(`/host/list/${next.slug}`);
              else submit();
            }}
            className={cn(
              'rounded-xl px-10 py-3 text-sm font-bold text-white transition-all active:scale-95 shadow-md flex items-center gap-2',
              nextDisabled || submitting
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700',
            )}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {next ? nextLabel : submitting ? 'Creating…' : 'Finish'}
          </button>
        </div>
      </footer>
    </div>
  );
}

// Shared option-card primitive used across several wizard steps.
export function OptionCard({
  selected,
  onClick,
  children,
  className,
}: {
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-left bg-white border rounded-2xl p-5 transition-all shadow-card hover:-translate-y-0.5',
        selected
          ? 'border-blue-600 ring-1 ring-blue-600 bg-blue-50/40'
          : 'border-gray-200 hover:border-gray-300',
        className,
      )}
    >
      {children}
    </button>
  );
}
