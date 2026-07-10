'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HelpCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useListingDraft } from '@/context/ListingDraftContext';

// Ordered list of the listing-creation wizard steps.
export const WIZARD_STEPS = [
  { slug: 'property-type', label: 'Property type', optional: false as const },
  { slug: 'location', label: 'Location', optional: false as const },
  { slug: 'capacity', label: 'Capacity', optional: false as const },
  { slug: 'amenities', label: 'Amenities', optional: false as const },
  { slug: 'photos', label: 'Photos', optional: false as const },
  { slug: 'details', label: 'Details', optional: false as const },
  { slug: 'pricing', label: 'Pricing', optional: false as const },
  { slug: 'house-rules', label: 'House rules', optional: false as const },
  { slug: 'verification', label: 'Verification', optional: false as const },
  { slug: 'discounts', label: 'Discounts', optional: true as const },
  { slug: 'addons', label: 'Add-ons', optional: true as const },
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
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-16 lg:px-20 h-20 bg-white shadow-sm border-b border-gray-100">
        <Link
          href="/"
          className="text-xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2"
        >
          <span>HOSTI</span><span className="text-blue-600">GGO</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/host/listings"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            Save &amp; Exit
          </Link>
          <button
            type="button"
            className="text-blue-600 hover:bg-blue-50 transition-colors p-2 rounded-lg"
            aria-label="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
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
      <main className="flex-grow pt-32 pb-32 px-6 md:px-16 lg:px-20 w-full">
        <div className="max-w-6xl mx-auto">
        <div className="mb-12">
            <div className="flex items-center gap-3 mb-3">
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
                Step {step} of {WIZARD_TOTAL}
              </p>
              {WIZARD_STEPS[idx]?.optional && (
                <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 bg-blue-50 text-blue-600 rounded-full">
                  Optional
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {children}
        </div>
      </main>

      {/* Footer nav */}
      <footer className="fixed bottom-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-16 lg:px-20 py-5 bg-white border-t border-gray-200 shadow-lg">
        <button
          type="button"
          onClick={() => (prev ? router.push(`/host/list/${prev.slug}`) : router.back())}
          className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all active:scale-95"
        >
          Back
        </button>
        <div className="flex items-center gap-6">
          <button
            type="button"
            className="hidden md:block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Need help?
          </button>
          <button
            type="button"
            disabled={nextDisabled || submitting}
            aria-disabled={nextDisabled || submitting}
            onClick={() => {
              if (next) router.push(`/host/list/${next.slug}`);
              else submit();
            }}
            className={cn(
              'rounded-lg px-8 py-2.5 text-sm font-bold text-white transition-all active:scale-95 shadow-sm flex items-center gap-2',
              nextDisabled || submitting
                ? 'bg-gray-400 cursor-not-allowed'
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
