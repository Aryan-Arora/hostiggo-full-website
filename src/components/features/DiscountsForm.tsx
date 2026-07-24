'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { ListingDiscount } from '@/lib/services/discounts';
import { cn } from '@/lib/utils';
import { HelpCircle, Loader2 } from 'lucide-react';

const DISCOUNT_TYPES = [
  {
    key: 'new_listing',
    label: 'New listing discount',
    description: 'Discount to guests for first 3 bookings',
  },
  {
    key: 'weekly',
    label: 'Weekly discount',
    description: '7+ nights discount to guests',
  },
  {
    key: 'monthly',
    label: 'Monthly discount',
    description: '28+ nights discount to guests',
  },
];

interface DiscountsFormProps {
  listingId: number;
  onSave?: () => void;
}

export default function DiscountsForm({ listingId, onSave }: DiscountsFormProps) {
  const { userId } = useAuth();
  const [discounts, setDiscounts] = useState<ListingDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changes, setChanges] = useState<Record<number, Partial<ListingDiscount>>>({});

  // Load discounts on mount
  useEffect(() => {
    loadDiscounts();
  }, [listingId]);

  const loadDiscounts = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/host/listings/${listingId}/discounts`
      );
      if (!response.ok) throw new Error('Failed to load discounts');
      const data = await response.json();
      setDiscounts(data.data || []);
      setChanges({});
    } catch (error) {
      console.error('Failed to load discounts:', error);
      toast.error('Failed to load discounts');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (discountId: number, enabled: boolean) => {
    setChanges((prev) => ({
      ...prev,
      [discountId]: {
        ...prev[discountId],
        enabled,
      },
    }));
  };

  const handlePercentChange = (discountId: number, percent: number) => {
    if (percent < 0 || percent > 100) return;
    setChanges((prev) => ({
      ...prev,
      [discountId]: {
        ...prev[discountId],
        percent,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const changedIds = Object.keys(changes).map(Number);

      await Promise.all(
        changedIds.map((discountId) => {
          const change = changes[discountId];
          return fetch(
            `/api/host/listings/${listingId}/discounts/${discountId}`,
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...change, userId }),
            }
          );
        })
      );

      toast.success('Discounts saved successfully');
      setChanges({});
      await loadDiscounts();
      onSave?.();
    } catch (error) {
      console.error('Failed to save discounts:', error);
      toast.error('Failed to save discounts');
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

  const hasChanges = Object.keys(changes).length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Add Discounts (optional)
        </h3>
        <p className="text-sm text-gray-600">
          Discounts help your place get bookings faster, but are completely optional
        </p>
      </div>

      <Link href="/support" className="text-xs font-medium text-figma-navy flex items-center gap-1 hover:underline w-fit">
        <HelpCircle className="w-4 h-4" />
        How discounts work?
      </Link>

      <div className="space-y-4">
        {discounts.map((discount) => {
          const type = DISCOUNT_TYPES.find((t) => t.key === discount.discount_type);
          const change = changes[discount.id];
          const enabled = change?.enabled !== undefined ? change.enabled : discount.enabled;
          const percent = change?.percent !== undefined ? change.percent : discount.percent;

          return (
            <div
              key={discount.id}
              className="p-4 border border-gray-200 rounded-lg bg-white"
            >
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{type?.label}</h4>
                  <p className="text-sm text-gray-600">{type?.description}</p>
                </div>
                <button
                  onClick={() => handleToggle(discount.id, !enabled)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    enabled ? 'bg-figma-navy' : 'bg-gray-300'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      enabled ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {enabled && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={percent}
                    onChange={(e) =>
                      handlePercentChange(discount.id, parseInt(e.target.value, 10) || 0)
                    }
                    min="0"
                    max="100"
                    className="w-16 px-3 py-2 border border-gray-300 rounded text-sm font-semibold text-center"
                  />
                  <span className="text-sm font-semibold text-gray-600">%</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hasChanges && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-figma-navy text-white font-semibold rounded-lg hover:bg-figma-navy/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Changes
        </button>
      )}
    </div>
  );
}
