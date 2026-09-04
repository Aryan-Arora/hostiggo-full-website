'use client';

import { ListingDraftProvider } from '@/context/ListingDraftContext';

// A layout persists across navigations between its child routes, so the draft
// context here keeps the host's selections as they move through the wizard.
//
// Aadhaar KYC is OPTIONAL and no longer interrupts this flow at all -- the
// host is never popped a verification modal on entering the listing flow (or
// right after sign-up / sign-in). The reminder lives entirely in the host
// dashboard banner (see KycStatusBanner) and Settings -> Identity
// Verification, both of which the host opens on their own terms.
export default function ListingWizardLayout({ children }: { children: React.ReactNode }) {
  return <ListingDraftProvider>{children}</ListingDraftProvider>;
}
