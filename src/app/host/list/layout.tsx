'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ListingDraftProvider } from '@/context/ListingDraftContext';
import { useAuth } from '@/context/AuthContext';
import { hasDeferredAadhaarKyc, hasSubmittedAadhaarKyc } from '@/lib/aadhaar';

// A layout persists across navigations between its child routes, so the draft
// context here keeps the host's selections as they move through the wizard.
export default function ListingWizardLayout({ children }: { children: React.ReactNode }) {
  const { userId, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Aadhaar KYC is OPTIONAL. A brand-new host is shown the verification page
  // once when they first enter the listing flow (for discoverability), but
  // "Do KYC verification later" on that page is a permanent choice -- after
  // that, the listing flow never interrupts them again. They can complete
  // verification whenever they want from Host Settings -> Identity
  // Verification. This is the one shared entry point every wizard/AI-flow
  // step routes through, so it's the only place the prompt needs to live.
  useEffect(() => {
    if (loading || !userId) return;
    if (hasSubmittedAadhaarKyc(userId) || hasDeferredAadhaarKyc(userId)) return;
    router.replace(`/kyc/aadhaar?redirect=${encodeURIComponent(pathname)}`);
  }, [loading, userId, pathname, router]);

  return <ListingDraftProvider>{children}</ListingDraftProvider>;
}
