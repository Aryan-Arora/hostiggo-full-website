'use client';

import { ListingDraftProvider } from '@/context/ListingDraftContext';

// A layout persists across navigations between its child routes, so the draft
// context here keeps the host's selections as they move through the 9 steps.
//
// Aadhaar KYC used to gate entry to this wizard -- removed for now, to be
// re-set-up separately (see [[project memory]] / team discussion).
export default function ListingWizardLayout({ children }: { children: React.ReactNode }) {
  return <ListingDraftProvider>{children}</ListingDraftProvider>;
}
