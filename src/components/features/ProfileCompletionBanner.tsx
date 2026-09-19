'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserCircle, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

/**
 * Guest-mode counterpart to KycStatusBanner (src/components/features/
 * KycStatusBanner.tsx, shown on every host dashboard page) -- this one
 * nudges a signed-in guest to finish their profile, shown on every guest
 * page that renders <Navbar /> (see the fragment returned there).
 *
 * "Complete" mirrors the exact check src/app/auth/callback/page.tsx uses to
 * decide whether a signed-in user still needs /onboarding (name + age).
 * That onboarding gate is normally what fills these in right after account
 * creation, but it can be skipped -- e.g. an OTP sign-in with an explicit
 * `redirect` query param goes straight to that destination instead (see
 * OTPPageContent.tsx) -- so this banner is the fallback reminder for a
 * profile that never got finished.
 */
export default function ProfileCompletionBanner() {
  const { user, isAuthenticated, loading } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (loading || dismissed || !isAuthenticated || !user) return null;

  const isComplete = Boolean(user.name?.trim()) && user.age != null;
  if (isComplete) return null;

  return (
    <div className="container-main pt-4">
      <div className="rounded-2xl border px-4 py-4 sm:px-5 bg-figma-navy/5 border-figma-navy/15">
        <div className="flex items-start gap-3.5">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-figma-navy/10 text-figma-navy">
            <UserCircle className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900">Complete your profile</p>
            <p className="mt-0.5 text-sm leading-relaxed text-gray-600">
              Add your name and a few details so hosts know who they&apos;re welcoming and we
              can reach you if plans change.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/account/profile"
              className="hidden sm:inline-flex whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition-colors bg-figma-navy hover:bg-figma-navy/90 text-white"
            >
              Complete profile
            </Link>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss"
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <Link
          href="/account/profile"
          className="mt-3 flex w-full items-center justify-center sm:hidden whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition-colors bg-figma-navy hover:bg-figma-navy/90 text-white"
        >
          Complete profile
        </Link>
      </div>
    </div>
  );
}
