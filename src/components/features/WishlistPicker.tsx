'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface WishlistPickerProps {
  userId: string;
  listingId: string | number;
  onClose: () => void;
  /** Called whenever membership changes, with whether the listing is now
   * saved to at least one list -- lets the heart icon that opened this
   * picker update its filled state without a full page refetch. */
  onSavedChange?: (savedAnywhere: boolean) => void;
  className?: string;
}

type Category = { id: string; name: string };

// Opens from a heart-button click across the app (PropertyCard,
// PropertyCardList, the property detail page) so a guest can choose *which*
// of their wishlists a listing goes into, rather than the old behavior of
// silently dumping every save into one undifferentiated "Saved" bucket --
// the wishlists table's real primary key (user_id, listing_id, category_id)
// already supported a listing belonging to several lists at once, nothing
// in the UI ever exposed it.
export default function WishlistPicker({
  userId,
  listingId,
  onClose,
  onSavedChange,
  className,
}: WishlistPickerProps) {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.wishlistCategories(userId),
      api.wishlistCategoriesForListing(userId, listingId),
    ])
      .then(([cats, savedIn]) => {
        if (!active) return;
        setCategories(cats.map((c: any) => ({ id: c.id, name: c.name })));
        setChecked(new Set(savedIn));
      })
      .catch(() => {
        if (active) setCategories([]);
      });
    return () => {
      active = false;
    };
  }, [userId, listingId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  const toggleCategory = async (categoryId: string) => {
    if (pendingId) return;
    const wasChecked = checked.has(categoryId);
    setPendingId(categoryId);
    setChecked((prev) => {
      const next = new Set(prev);
      if (wasChecked) next.delete(categoryId);
      else next.add(categoryId);
      onSavedChange?.(next.size > 0);
      return next;
    });
    try {
      if (wasChecked) {
        await api.removeWishlistItem(userId, String(listingId), categoryId);
      } else {
        await api.addWishlistItem(userId, String(listingId), categoryId);
      }
    } catch (err) {
      // Roll back on failure.
      setChecked((prev) => {
        const next = new Set(prev);
        if (wasChecked) next.add(categoryId);
        else next.delete(categoryId);
        onSavedChange?.(next.size > 0);
        return next;
      });
      toast.error(err instanceof Error ? err.message : 'Could not update wishlist.');
    } finally {
      setPendingId(null);
    }
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(false);
    setPendingId('__creating__');
    try {
      const category = await api.createWishlistCategory(userId, name);
      setCategories((prev) => [...(prev ?? []), { id: category.id, name: category.name }]);
      setNewName('');
      // A brand-new list is the whole reason this got created -- save the
      // listing into it immediately instead of leaving the guest to also
      // separately check the box they just made.
      await toggleCategory(category.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create list.');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 w-[240px] bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 animate-fade-in-down',
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        Save to wishlist
      </p>

      {categories === null ? (
        <div className="px-4 py-6 flex justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        </div>
      ) : categories.length === 0 && !creating ? (
        <div className="px-4 py-3">
          <p className="text-[12px] text-gray-500 mb-2">You don&apos;t have any wishlists yet.</p>
        </div>
      ) : (
        <div className="max-h-[220px] overflow-y-auto">
          {categories.map((cat) => {
            const isChecked = checked.has(cat.id);
            const isPending = pendingId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                disabled={isPending}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-left hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                <span
                  className={cn(
                    'w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors',
                    isChecked ? 'bg-figma-navy border-figma-navy' : 'border-gray-300',
                  )}
                >
                  {isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                  ) : isChecked ? (
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  ) : null}
                </span>
                <span className="flex-1 truncate text-gray-800 font-medium">{cat.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {creating ? (
        <div className="px-3 pt-1.5">
          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') setCreating(false);
            }}
            placeholder="e.g. Manali trip"
            maxLength={40}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-figma-navy/40 focus:ring-2 focus:ring-figma-navy/10"
          />
          <div className="flex items-center gap-2 mt-2 pb-1">
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="flex-1 py-1.5 bg-figma-navy text-white text-[12px] font-semibold rounded-lg disabled:opacity-40"
            >
              Create
            </button>
            <button
              onClick={() => setCreating(false)}
              className="flex-1 py-1.5 bg-gray-100 text-gray-600 text-[12px] font-semibold rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-figma-navy hover:bg-gray-50 transition-colors border-t border-gray-100 mt-1"
        >
          <Plus className="w-4 h-4" />
          Create new list
        </button>
      )}
    </div>
  );
}
