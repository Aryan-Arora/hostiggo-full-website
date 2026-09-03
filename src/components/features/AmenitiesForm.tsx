'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import AmenityGrid from '@/components/features/AmenityGrid';
import { dbIdsFromStringIds, stringIdsFromDbIds } from '@/lib/amenityCatalog';

export default function AmenitiesForm({ listingId }: { listingId: number }) {
  const { userId } = useAuth();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/host/listings/${listingId}/amenities`);
        if (!res.ok) throw new Error('Failed to load amenities');
        const { data } = (await res.json()) as { data: { amenityIds: number[] } };
        if (active) setSelected(stringIdsFromDbIds(data?.amenityIds ?? []));
      } catch (err) {
        console.error('Failed to load amenities:', err);
        if (active) toast.error('Failed to load amenities');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [listingId]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleSave = async () => {
    if (!userId) {
      toast.error('Please sign in again.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/host/listings/${listingId}/amenities`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amenityIds: dbIdsFromStringIds(selected) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to save amenities');
      }
      toast.success('Amenities updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save amenities');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-figma-navy" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AmenityGrid selected={selected} onToggle={toggle} />
      <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-figma-navy text-white rounded-lg font-semibold hover:bg-figma-navy/90 disabled:opacity-60 inline-flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Saving…' : 'Save amenities'}
        </button>
        <span className="text-sm text-gray-500">{selected.size} selected</span>
      </div>
    </div>
  );
}
