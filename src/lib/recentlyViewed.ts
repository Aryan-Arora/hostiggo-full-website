// Per-browser "recently viewed" listings. There was no tracking at all
// before: the wishlist page's "Recent viewed" tab was just a label on the
// "all saved items" view, so viewing a property never changed it.
//
// Stored in localStorage (most recent first, de-duplicated, capped) so it
// works for signed-out guests too. The wishlist page listens for the
// `storage` event and a same-tab custom event so it refreshes live.

const KEY = "hostiggo:recently-viewed";
const MAX = 12;
export const RECENTLY_VIEWED_EVENT = "hostiggo:recently-viewed-changed";

export function getRecentlyViewedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.map(String).filter((id) => /^\d+$/.test(id)).slice(0, MAX)
      : [];
  } catch {
    return [];
  }
}

export function recordRecentlyViewed(listingId: string | number) {
  if (typeof window === "undefined") return;
  const id = String(listingId);
  if (!/^\d+$/.test(id)) return;
  try {
    const next = [id, ...getRecentlyViewedIds().filter((x) => x !== id)].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(RECENTLY_VIEWED_EVENT));
  } catch {
    /* storage unavailable -- best effort */
  }
}
