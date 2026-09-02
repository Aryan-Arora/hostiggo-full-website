'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

// The 5 named stages of the AI listing flow (distinct from the manual
// wizard's 13 numbered steps in WizardShell -- this flow is reached via
// /host/list/method's "List with AI" card).
export const AI_FLOW_STAGES = [
  { key: 'method', label: 'Method', href: '/host/list/method' },
  { key: 'setup', label: 'Setup', href: '/host/list/ai/setup' },
  { key: 'processing', label: 'Processing', href: '/host/list/ai/processing' },
  { key: 'review', label: 'Review', href: '/host/list/ai/review' },
  { key: 'publish', label: 'Publish', href: '/host/list/ai/publish' },
] as const;

export type AiFlowStageKey = (typeof AI_FLOW_STAGES)[number]['key'];

// Shared top nav + stage breadcrumb for the AI listing-import flow. The host
// is already required to be signed in to reach anything under /host/list (see
// host/list/layout.tsx), so unlike the public marketing header this omits
// "Sign In" entirely -- only "Dashboard" makes sense here.
export default function AiFlowShell({
  stage,
  showBack = true,
  onBack,
  children,
}: {
  stage: AiFlowStageKey;
  showBack?: boolean;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const stageIdx = AI_FLOW_STAGES.findIndex((s) => s.key === stage);

  return (
    <div className="min-h-screen bg-[#FFFEF9] relative overflow-hidden">
      {/* Decorative background circles, matching the rest of the host-list flow's soft brand styling */}
      <div className="pointer-events-none absolute -left-24 top-24 w-72 h-72 rounded-full bg-figma-navy/10" />
      <div className="pointer-events-none absolute -right-40 top-0 w-[420px] h-[420px] rounded-full bg-figma-navy/5" />
      <div className="pointer-events-none absolute -right-24 bottom-0 w-72 h-72 rounded-full bg-figma-navy/5" />

      {/* Top nav */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-16 lg:px-20 h-20 bg-white border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Hostiggo" width={32} height={32} className="rounded-full" />
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/become-a-host" className="text-sm font-semibold text-gray-800 hover:text-figma-navy transition-colors">
            For Hosts
          </Link>
          <Link href="/support" className="text-sm font-semibold text-gray-800 hover:text-figma-navy transition-colors">
            Support
          </Link>
        </nav>
        <Link
          href="/host/listings"
          className="rounded-full bg-figma-navy px-6 py-2.5 text-sm font-bold text-white hover:bg-figma-navy/90 transition-colors"
        >
          Dashboard
        </Link>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 md:px-10 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-8 flex-wrap">
          {AI_FLOW_STAGES.map((s, i) => {
            const isCurrent = i === stageIdx;
            const isPast = i < stageIdx;
            const clickable = isPast; // future stages aren't reachable yet
            const label = (
              <span
                className={cn(
                  'font-medium',
                  isCurrent && 'text-figma-navy font-bold underline underline-offset-4',
                  isPast && !isCurrent && 'text-figma-navy hover:underline',
                  !isPast && !isCurrent && 'text-gray-400',
                )}
              >
                {s.label}
              </span>
            );
            return (
              <span key={s.key} className="flex items-center gap-2">
                {i > 0 && <span className="text-gray-300">›</span>}
                {clickable ? <Link href={s.href}>{label}</Link> : label}
              </span>
            );
          })}
        </nav>

        {showBack && (
          <button
            type="button"
            onClick={() => (onBack ? onBack() : router.back())}
            aria-label="Go back"
            className="mb-6 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </button>
        )}

        {children}
      </main>
    </div>
  );
}
