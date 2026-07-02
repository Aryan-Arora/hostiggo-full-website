'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

// The draft a host builds across the 9 wizard steps. Persisted to localStorage
// so it survives step navigation and reloads, then POSTed on Finish.
export type ListingDraft = {
  propertyType?: string;
  title?: string;
  description?: string;
  priceWeekday?: number;
  priceWeekend?: number;
  numGuests?: number;
  numBedrooms?: number;
  numBeds?: number;
  numBathrooms?: number;
  amenityIds?: number[];
  photoUrls?: string[];
  addressLine1?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
};

const STORAGE_KEY = 'hostiggo:listing-draft';

type Ctx = {
  draft: ListingDraft;
  update: (patch: Partial<ListingDraft>) => void;
  reset: () => void;
  submit: () => Promise<void>;
  submitting: boolean;
};

const ListingDraftContext = createContext<Ctx | undefined>(undefined);

export function ListingDraftProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { userId, isAuthenticated } = useAuth();
  const [draft, setDraft] = useState<ListingDraft>({});
  const [submitting, setSubmitting] = useState(false);

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDraft(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const update = useCallback(
    (patch: Partial<ListingDraft>) => {
      setDraft((cur) => {
        // Merge against whatever is in storage too, so a step writing during the
        // post-reload hydration window can't clobber earlier steps' data.
        let stored: ListingDraft = {};
        try {
          stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        } catch {
          /* ignore */
        }
        const next = { ...stored, ...cur, ...patch };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [],
  );

  const reset = useCallback(() => {
    setDraft({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const submit = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      toast('Please sign in to publish your listing.');
      router.push('/signin?redirect=/host/list/verification');
      return;
    }
    setSubmitting(true);
    try {
      await api.createListing({ userId, ...draft });
      reset();
      toast.success('Listing created! It will appear once reviewed.');
      router.push('/host/listings?created=1');
    } catch (err) {
      console.error('[listing-draft] submit failed:', err);
      toast.error(err instanceof Error ? err.message : 'Could not create the listing.');
    } finally {
      setSubmitting(false);
    }
  }, [draft, userId, isAuthenticated, reset, router]);

  return (
    <ListingDraftContext.Provider value={{ draft, update, reset, submit, submitting }}>
      {children}
    </ListingDraftContext.Provider>
  );
}

export function useListingDraft(): Ctx {
  const ctx = useContext(ListingDraftContext);
  if (!ctx) throw new Error('useListingDraft must be used within ListingDraftProvider');
  return ctx;
}
