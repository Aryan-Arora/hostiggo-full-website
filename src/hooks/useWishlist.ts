import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

// Every property card on a page (search results can show 20+) mounts this
// hook independently. Without sharing the fetch, each one fires its own
// identical `GET /api/wishlist?resource=ids` request. This in-memory cache
// de-dupes concurrent requests for the same user so only one network call
// happens per userId per page load.
const inflightByUser = new Map<string, Promise<{ listing_id: string }[]>>();
function fetchWishlistIds(userId: string) {
  let p = inflightByUser.get(userId);
  if (!p) {
    p = api.wishlistIds(userId).finally(() => inflightByUser.delete(userId));
    inflightByUser.set(userId, p);
  }
  return p;
}

// Tracks which listings the current guest has saved, and lets any card
// toggle membership. Backed by the real wishlists table (api.addWishlistItem
// / api.removeWishlistItem) — previously nothing in the app called the add
// endpoint at all, so every heart icon was cosmetic local state.
export function useWishlist(userId: string | null | undefined) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    if (!userId) {
      setIds(new Set());
      setLoaded(true);
      return;
    }
    setLoaded(false);
    fetchWishlistIds(userId)
      .then((rows) => {
        if (active) setIds(new Set(rows.map((r) => String(r.listing_id))));
      })
      .catch(() => {
        if (active) setIds(new Set());
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const isSaved = useCallback((listingId: string | number) => ids.has(String(listingId)), [ids]);

  const toggle = useCallback(
    async (listingId: string | number) => {
      if (!userId) return false;
      const key = String(listingId);
      const wasSaved = ids.has(key);
      // Optimistic update so the heart responds instantly.
      setIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(key);
        else next.add(key);
        return next;
      });
      try {
        if (wasSaved) {
          await api.removeWishlistItem(userId, key);
        } else {
          await api.addWishlistItem(userId, key);
        }
        return true;
      } catch (err) {
        // Roll back on failure.
        setIds((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(key);
          else next.delete(key);
          return next;
        });
        throw err;
      }
    },
    [ids, userId],
  );

  return { isSaved, toggle, loaded };
}
