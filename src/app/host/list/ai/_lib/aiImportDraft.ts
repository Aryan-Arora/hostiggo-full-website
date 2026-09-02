// Local-only state for the AI-import flow (Setup -> Processing -> Review ->
// Publish). Kept separate from ListingDraftContext (used by the manual
// wizard) since these are import-source fields (source URL, iCal link,
// per-import toggles) that have no column to persist into and aren't part
// of what actually gets sent to createListing.
//
// NOTE: there is no real scraping/AI-generation backend yet -- Processing
// simulates it client-side (see ai/processing/page.tsx). Once a real
// service exists, swap the simulation there for an actual API call; nothing
// else in this flow needs to change.

export type AiListingImport = {
  airbnbUrl: string;
  icalUrl: string;
  importAllPhotosA: boolean; // literal duplicate toggle, matches the provided design
  importAllPhotosB: boolean;
};

export type AiImportDraft = {
  listings: AiListingImport[];
  multiMode: boolean;
};

const STORAGE_KEY = 'hostiggo:ai-listing-import';

export const emptyImport = (): AiListingImport => ({
  airbnbUrl: '',
  icalUrl: '',
  importAllPhotosA: true,
  importAllPhotosB: true,
});

export function loadAiImportDraft(): AiImportDraft {
  if (typeof window === 'undefined') return { listings: [emptyImport()], multiMode: false };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { listings: [emptyImport()], multiMode: false };
}

export function saveAiImportDraft(draft: AiImportDraft): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}

export function clearAiImportDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// The AI-"generated" listing content a host reviews/edits before publishing.
// Seeded with placeholder content by Processing (since there's no real AI
// backend yet) -- see the note above.
export type AiGeneratedListing = {
  title: string;
  description: string;
  numGuests: number;
  numBedrooms: number;
  numBeds: number;
  numBathrooms: number;
  amenityIds: number[];
  priceWeekday: number;
  priceWeekend: number;
  photosImported: number;
  amenitiesFound: number;
  aiScore: number;
};

const GENERATED_KEY = 'hostiggo:ai-listing-generated';

export function loadGeneratedListing(): AiGeneratedListing | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(GENERATED_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveGeneratedListing(listing: AiGeneratedListing): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(GENERATED_KEY, JSON.stringify(listing));
  } catch {
    /* ignore */
  }
}

export function clearGeneratedListing(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(GENERATED_KEY);
  } catch {
    /* ignore */
  }
}
