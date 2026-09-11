'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  Heart,
  Star,
  ChevronDown,
  ArrowLeft,
  Plus,
  Edit2,
  Check,
  X,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/layout/Navbar';
import CopyrightBar from '@/components/layout/CopyrightBar';
import { cn } from '@/lib/utils';
import { api, mapWishlistListing } from '@/lib/api';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────

interface WishlistProperty {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviews: number;
  price: number;
  nights: number;
  image: string;
  liked: boolean;
  group: string; // which wishlist group this belongs to
}

interface WishlistGroup {
  id: string;
  name: string;
  isDefault?: boolean; // default groups can't be renamed/removed
}

// ── Data ──────────────────────────────────────────────────────────────────────

const DEFAULT_GROUPS: WishlistGroup[] = [
  { id: 'all', name: 'Recent viewed', isDefault: true },
];

// ── Confirmation Modal ────────────────────────────────────────────────────────

function ConfirmModal({
  groupName,
  onConfirm,
  onCancel,
}: {
  groupName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-[320px] mx-4 animate-slide-up">
        <p className="text-[15px] font-semibold text-gray-800 leading-relaxed mb-5">
          Confirm to remove <span className="text-figma-navy">&quot;{groupName}&quot;</span>{' '}
          from list?
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-[#004772] text-white text-[14px] font-semibold rounded-xl hover:bg-[#003a5c] active:scale-[0.98] transition-all"
          >
            Yes
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 bg-gray-100 text-gray-600 text-[14px] font-semibold rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Create New List Modal ─────────────────────────────────────────────────────

function CreateListModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter' && name.trim()) onConfirm(name.trim());
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [name, onCancel, onConfirm]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-[320px] mx-4 animate-slide-up">
        <h3 className="text-[16px] font-bold text-gray-900 mb-1">
          Create new wishlist
        </h3>
        <p className="text-[13px] text-gray-500 mb-4">
          Give your new wishlist a name
        </p>
        <input
          ref={inputRef}
          type="text"
          placeholder="e.g. Manali trip"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] text-gray-800 outline-none focus:border-figma-navy/40 focus:ring-2 focus:ring-figma-navy/10 transition-all mb-4"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => name.trim() && onConfirm(name.trim())}
            disabled={!name.trim()}
            className="flex-1 py-2.5 bg-[#004772] text-white text-[14px] font-semibold rounded-xl hover:bg-[#003a5c] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Create
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 bg-gray-100 text-gray-600 text-[14px] font-semibold rounded-xl hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Rename Modal ──────────────────────────────────────────────────────────────

function RenameModal({
  currentName,
  onConfirm,
  onCancel,
}: {
  currentName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter' && name.trim()) onConfirm(name.trim());
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [name, onCancel, onConfirm]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-[320px] mx-4 animate-slide-up">
        <h3 className="text-[16px] font-bold text-gray-900 mb-4">
          Rename wishlist
        </h3>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] text-gray-800 outline-none focus:border-figma-navy/40 focus:ring-2 focus:ring-figma-navy/10 transition-all mb-4"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => name.trim() && onConfirm(name.trim())}
            disabled={!name.trim()}
            className="flex-1 py-2.5 bg-[#004772] text-white text-[14px] font-semibold rounded-xl hover:bg-[#003a5c] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 bg-gray-100 text-gray-600 text-[14px] font-semibold rounded-xl hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Group Dropdown ────────────────────────────────────────────────────────────

interface GroupDropdownProps {
  groups: WishlistGroup[];
  selected: string;
  onSelect: (id: string) => void;
  onRenameGroup: (id: string) => void;
  onRemoveGroup: (id: string) => void;
}

function GroupDropdown({
  groups,
  selected,
  onSelect,
  onRenameGroup,
  onRemoveGroup,
}: GroupDropdownProps) {
  const [open, setOpen] = useState(false);
  const [kebabOpen, setKebabOpen] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const kebabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setKebabOpen(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = groups.find((g) => g.id === selected) ?? groups[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setKebabOpen(null);
        }}
        className={cn(
          'flex items-center justify-between gap-2.5 border rounded-full px-4 py-2 text-[13px] sm:text-[14px] font-medium bg-white transition-all duration-200 select-none min-w-[150px] shadow-sm',
          open
            ? 'border-gray-800 text-gray-900 shadow-md ring-2 ring-gray-100'
            : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:shadow',
        )}
      >
        <span className="flex-1 text-left truncate">{current.name}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-gray-500 transition-transform duration-200 flex-shrink-0',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] w-[220px] bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-fade-in-down overflow-visible">
          {groups.map((grp) => (
            <div key={grp.id} className="relative group/item flex items-center">
              <button
                type="button"
                onClick={() => {
                  onSelect(grp.id);
                  setOpen(false);
                  setKebabOpen(null);
                }}
                className={cn(
                  'flex-1 flex items-center justify-between gap-3 px-4 py-2.5 text-[13px] transition-colors duration-150 text-left',
                  grp.id === selected
                    ? 'text-gray-900 font-semibold bg-gray-50'
                    : 'text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-800',
                )}
              >
                <span className="truncate">{grp.name}</span>
                {grp.id === selected && (
                  <Check
                    className="w-4 h-4 text-figma-navy flex-shrink-0"
                    strokeWidth={2.5}
                  />
                )}
              </button>

              {/* 3-dot menu for non-default groups */}
              {!grp.isDefault && (
                <div
                  className="relative pr-2"
                  ref={grp.id === kebabOpen ? kebabRef : undefined}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setKebabOpen((prev) => (prev === grp.id ? null : grp.id));
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {kebabOpen === grp.id && (
                    <div className="absolute right-0 top-[calc(100%+2px)] w-[130px] bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-[200] animate-fade-in-down">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setKebabOpen(null);
                          setOpen(false);
                          onRenameGroup(grp.id);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5 text-gray-400" />
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setKebabOpen(null);
                          setOpen(false);
                          onRemoveGroup(grp.id);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Wishlist Card ─────────────────────────────────────────────────────────────

interface WishlistCardProps {
  property: WishlistProperty;
  editMode: boolean;
  onToggleHeart: () => void;
  onRemove: () => void;
  onClick: () => void;
  removing: boolean;
}

function WishlistCard({
  property,
  editMode,
  onToggleHeart,
  onRemove,
  onClick,
  removing,
}: WishlistCardProps) {
  const [imgErr, setImgErr] = useState(false);
  const FALLBACK =
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=450&fit=crop&q=80';

  return (
    <div
      className={cn(
        'bg-white rounded-2xl overflow-hidden border border-gray-100 cursor-pointer group transition-all duration-300 flex flex-col',
        removing
          ? 'opacity-0 scale-90 pointer-events-none'
          : 'opacity-100 scale-100',
        'hover:shadow-lg hover:-translate-y-0.5',
      )}
      style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}
      onClick={!editMode ? onClick : undefined}
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/3] w-full">
        <Image
          fill
          src={imgErr ? FALLBACK : property.image}
          alt={property.name}
          onError={() => setImgErr(true)}
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Edit mode: ❌ remove icon */}
        {editMode ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-150 z-10"
            aria-label="Remove stay"
          >
            <X className="w-3.5 h-3.5 text-gray-600" strokeWidth={2.5} />
          </button>
        ) : (
          /* Normal mode: heart icon */
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleHeart();
            }}
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-150"
            aria-label="Toggle wishlist"
          >
            <Heart
              className={cn(
                'w-3.5 h-3.5 transition-colors duration-200',
                property.liked
                  ? 'fill-rose-500 text-rose-500'
                  : 'text-gray-400 fill-transparent',
              )}
            />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-[13px] font-bold text-gray-900 mb-0.5 leading-snug line-clamp-1">
            {property.name}
          </h3>
          <p className="text-[11.5px] text-gray-400 mb-2.5 leading-none">
            {property.location}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-1 mb-3">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
            <span className="text-[12px] font-bold text-gray-700">
              {property.rating}
            </span>
            <span className="text-[11px] text-gray-400">
              · {property.reviews} reviews
            </span>
          </div>

          <div className="inline-flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1">
            <span className="text-[12px] font-extrabold text-gray-900">
              ₹ {property.price.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-gray-400">
              / {property.nights} Nights
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function WishlistPage() {
  const [groups, setGroups] = useState<WishlistGroup[]>(DEFAULT_GROUPS);
  const [properties, setProperties] = useState<WishlistProperty[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [editMode, setEditMode] = useState(false);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [confirmRemoveGroup, setConfirmRemoveGroup] =
    useState<WishlistGroup | null>(null);
  const [renameGroup, setRenameGroup] = useState<WishlistGroup | null>(null);

  const router = useRouter();
  const { userId, loading: isLoading } = useAuth();

  useEffect(() => {
    if (!userId) {
      setGroups(DEFAULT_GROUPS);
      setProperties([]);
      return;
    }

    let mounted = true;

    const loadWishlist = async () => {
      try {
        const [categories, listings] = await Promise.all([
          api.wishlistCategories(userId),
          api.wishlistListings(userId, selectedGroup),
        ]);

        if (!mounted) return;
        const customGroups = categories.map((category: any) => ({
          id: category.id,
          name: category.name,
          isDefault: false,
        }));
        setGroups([...DEFAULT_GROUPS, ...customGroups]);
        setProperties(listings.map(mapWishlistListing));
      } catch (error) {
        console.error('[wishlist] failed to load:', error);
        if (mounted) setProperties([]);
      }
    };

    loadWishlist();

    return () => {
      mounted = false;
    };
  }, [userId, selectedGroup]);

  // Filter visible properties -- "all" shows everything
  const visibleProperties = properties.filter((p) => {
    if (selectedGroup === 'all') return p.liked;
    return p.liked && p.group === selectedGroup;
  });

  const toggleHeart = (id: string) => {
    removeProperty(id);
  };

  const removeProperty = (id: string) => {
    setRemovingIds((prev) => new Set(prev).add(id));
    const remove = async () => {
      try {
        if (userId) {
          await api.removeWishlistItem(
            userId,
            id,
            selectedGroup === 'all' ? undefined : selectedGroup,
          );
        }
        setProperties((prev) => prev.filter((p) => p.id !== id));
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to remove wishlist item',
        );
      } finally {
        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    };
    setTimeout(remove, 300);
  };

  // Group management
  const handleCreateGroup = async (name: string) => {
    if (!userId) {
      toast.error('Please sign in to create a wishlist');
      return;
    }

    try {
      const category = await api.createWishlistCategory(userId, name);
      setGroups((prev) => [
        ...prev,
        { id: category.id, name: category.name, isDefault: false },
      ]);
      setSelectedGroup(category.id);
      setShowCreateModal(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create wishlist',
      );
    }
  };

  const handleRenameGroup = async (newName: string) => {
    if (!renameGroup || !userId) return;
    try {
      await api.renameWishlistCategory(renameGroup.id, newName, userId);
      setGroups((prev) =>
        prev.map((g) =>
          g.id === renameGroup.id ? { ...g, name: newName } : g,
        ),
      );
      setRenameGroup(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to rename wishlist',
      );
    }
  };

  const handleRemoveGroupConfirm = async () => {
    if (!confirmRemoveGroup || !userId) return;
    try {
      await api.deleteWishlistCategory(confirmRemoveGroup.id, userId);
      setGroups((prev) => prev.filter((g) => g.id !== confirmRemoveGroup.id));
      setProperties((prev) =>
        prev.filter((p) => p.group !== confirmRemoveGroup.id),
      );
      if (selectedGroup === confirmRemoveGroup.id) setSelectedGroup('all');
      setConfirmRemoveGroup(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove wishlist',
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3.5 mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex-shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1
            className={cn(
              'text-[28px] sm:text-[34px] font-extrabold tracking-tight transition-colors',
              editMode
                ? 'text-figma-navy underline decoration-2 underline-offset-4'
                : 'text-gray-900',
            )}
          >
            My wishlists
          </h1>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3 mb-8">
          {/* Group dropdown */}
          <GroupDropdown
            groups={groups}
            selected={selectedGroup}
            onSelect={setSelectedGroup}
            onRenameGroup={(id) => {
              const g = groups.find((g) => g.id === id);
              if (g) setRenameGroup(g);
            }}
            onRemoveGroup={(id) => {
              const g = groups.find((g) => g.id === id);
              if (g) setConfirmRemoveGroup(g);
            }}
          />

          {/* Add new list */}
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
            aria-label="Create new list"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Edit / Done button */}
          <div className="ml-auto">
            {editMode ? (
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="px-5 py-2 bg-[#004772] text-white text-[13px] font-bold rounded-full hover:bg-[#003a5c] transition-all shadow-sm"
              >
                Done
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-600 cursor-pointer hover:text-gray-900 transition-colors"
              >
                <span>Edit</span>
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Cards section */}
        {!isLoading && !userId ? (
          <div className="text-center py-16 mb-14">
            <div className="text-5xl mb-4">🔒</div>
            <p className="text-gray-400 text-lg font-medium mb-1">
              Sign in to see your wishlist
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Your saved stays will show up here once you&apos;re signed in.
            </p>
            <button
              type="button"
              onClick={() => router.push('/signin?redirect=/wishlist')}
              className="bg-[#004772] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#003a5c] transition-colors shadow-sm"
            >
              Sign in
            </button>
          </div>
        ) : visibleProperties.length > 0 ? (
          <div className="mb-14">
            {/* Clean 4-column grid on large screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {visibleProperties.map((prop) => (
                <WishlistCard
                  key={prop.id}
                  property={prop}
                  editMode={editMode}
                  onToggleHeart={() => toggleHeart(prop.id)}
                  onRemove={() => removeProperty(prop.id)}
                  onClick={() => router.push(`/property/${prop.id}`)}
                  removing={removingIds.has(prop.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 mb-14">
            <div className="text-5xl mb-4">❤️</div>
            <p className="text-gray-400 text-lg font-medium mb-1">
              This wishlist is empty
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Explore stays and save your favourites here.
            </p>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="bg-[#004772] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#003a5c] transition-colors shadow-sm"
            >
              Explore stays
            </button>
          </div>
        )}
      </main>

      {/* Custom Graphical Banner replacing old "End of list" and Footer */}
      <div className="relative w-full h-[250px] overflow-hidden mt-12 flex items-end">
        {/* Left Leaf */}
        <img
          src="/images/green-grass-left.png"
          alt="Green grass left decoration"
          className="absolute bottom-0 left-0 w-48 md:w-64 object-contain z-10 pointer-events-none"
        />

        {/* Right Leaf */}
        <img
          src="/images/green-grass-right.png"
          alt="Green grass right decoration"
          className="absolute bottom-0 right-0 w-48 md:w-64 object-contain z-10 pointer-events-none"
        />

        {/* Center Woman */}
        <img
          src="/images/empty-states/woman-beach.png"
          alt="Woman on beach"
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 md:w-56 object-contain z-20 pointer-events-none"
        />

        {/* Copyright Bar spanning entire width at absolute bottom */}
        <div className="w-full relative z-0">
          <CopyrightBar />
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateListModal
          onConfirm={handleCreateGroup}
          onCancel={() => setShowCreateModal(false)}
        />
      )}
      {confirmRemoveGroup && (
        <ConfirmModal
          groupName={confirmRemoveGroup.name}
          onConfirm={handleRemoveGroupConfirm}
          onCancel={() => setConfirmRemoveGroup(null)}
        />
      )}
      {renameGroup && (
        <RenameModal
          currentName={renameGroup.name}
          onConfirm={handleRenameGroup}
          onCancel={() => setRenameGroup(null)}
        />
      )}
    </div>
  );
}
