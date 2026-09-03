'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ListingDraftProvider } from '@/context/ListingDraftContext';
import { useAuth } from '@/context/AuthContext';
import { hasSkippedAadhaarKycThisAttempt, hasSubmittedAadhaarKyc } from '@/lib/aadhaar';

// A layout persists across navigations between its child routes, so the draft
// context here keeps the host's selections as they move through the 9 steps.
export default function ListingWizardLayout({ children }: { children: React.ReactNode }) {
  const { userId, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Aadhaar KYC is required before a host can start listing a property --
  // not at booking time (guests aren't gated at all) and not at general
  // login (a guest just signing in to browse shouldn't be interrupted).
  // This is the one shared entry point every wizard/AI-flow step routes
  // through, so it's the only place this needs to be checked.
  //
  // A host can defer it once via "Do KYC verification later" on the KYC
  // page (see hasSkippedAadhaarKycThisAttempt) -- that holds off the gate
  // for the rest of *this* listing attempt. The skip is cleared at the
  // moments that actually represent "this attempt is over": a successful
  // publish (ListingDraftContext.submit()) or an explicit abandon
  // (WizardShell's exit-confirm, the AI review page's Discard) -- not from
  // this layout mounting/unmounting, which happens on every step
  // navigation (and, in dev, gets double-invoked by StrictMode) and would
  // clear a skip on the very redirect it was just set to survive.
  useEffect(() => {
    if (loading || !userId) return;
    if (hasSubmittedAadhaarKyc(userId) || hasSkippedAadhaarKycThisAttempt(userId)) return;
    router.replace(`/kyc/aadhaar?redirect=${encodeURIComponent(pathname)}`);
  }, [loading, userId, pathname, router]);

  return <ListingDraftProvider>{children}</ListingDraftProvider>;
}
