# Integration Examples

## Example 1: Multi-Step Listing Wizard

```tsx
'use client';

import { useState } from 'react';
import DiscountsForm from '@/components/features/DiscountsForm';
import AddonsForm from '@/components/features/AddonsForm';

type Step = 'discounts' | 'addons' | 'publish';

interface ListingWizardProps {
  listingId: number;
  onPublish: () => Promise<void>;
}

export default function ListingWizard({ listingId, onPublish }: ListingWizardProps) {
  const [step, setStep] = useState<Step>('discounts');
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    try {
      setPublishing(true);
      await onPublish();
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex gap-4">
        {(['discounts', 'addons', 'publish'] as const).map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                s === step
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {i + 1}
            </div>
            {i < 2 && <div className="w-8 h-0.5 bg-gray-200 mx-2" />}
          </div>
        ))}
      </div>

      {step === 'discounts' && (
        <div className="space-y-4">
          <DiscountsForm listingId={listingId} />
          <div className="flex gap-4 pt-6">
            <button
              onClick={() => setStep('addons')}
              className="flex-1 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
            >
              Continue
            </button>
            <button
              onClick={() => setStep('addons')}
              className="flex-1 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
            >
              Skip Discounts
            </button>
          </div>
        </div>
      )}

      {step === 'addons' && (
        <div className="space-y-4">
          <AddonsForm listingId={listingId} />
          <div className="flex gap-4 pt-6">
            <button
              onClick={() => setStep('discounts')}
              className="flex-1 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => setStep('publish')}
              className="flex-1 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
            >
              Continue
            </button>
            <button
              onClick={() => setStep('publish')}
              className="flex-1 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
            >
              Skip Addons
            </button>
          </div>
        </div>
      )}

      {step === 'publish' && (
        <div className="space-y-4">
          <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">Ready to Publish?</h3>
            <p className="text-sm text-green-800 mb-4">
              Your listing is all set. Click below to publish and start receiving bookings.
            </p>
          </div>
          <div className="flex gap-4 pt-6">
            <button
              onClick={() => setStep('addons')}
              className="flex-1 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="flex-1 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {publishing ? 'Publishing...' : 'Publish Listing'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

## Example 2: Manage Listings with Discount/Addon Edit Link

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Pencil, Loader2 } from 'lucide-react';

interface Listing {
  listing_id: number;
  title: string;
  price_weekday: number;
  discounts_count?: number;
  addons_count?: number;
}

export default function ManageListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      const response = await fetch('/api/host/listings');
      if (!response.ok) throw new Error('Failed to load listings');
      const data = await response.json();
      setListings(data.data || []);
    } catch (error) {
      console.error('Failed to load listings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>;
  }

  return (
    <div className="space-y-4">
      {listings.map((listing) => (
        <div
          key={listing.listing_id}
          className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{listing.title}</h3>
              <p className="text-sm text-gray-600">₹{listing.price_weekday}/night</p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/host/listings/manage/${listing.listing_id}/discounts-addons`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit Discounts & Addons
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Example 3: Discount Display in Booking Preview

```tsx
'use client';

import { useEffect, useState } from 'react';
import { ListingDiscount } from '@/lib/services/discounts';

interface BookingPreviewProps {
  listingId: number;
  nights: number;
  basePrice: number;
}

export default function BookingPreview({
  listingId,
  nights,
  basePrice,
}: BookingPreviewProps) {
  const [discounts, setDiscounts] = useState<ListingDiscount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDiscounts();
  }, [listingId]);

  const loadDiscounts = async () => {
    try {
      const response = await fetch(
        `/api/host/listings/${listingId}/discounts`
      );
      if (!response.ok) throw new Error('Failed to load discounts');
      const data = await response.json();
      setDiscounts(data.data || []);
    } catch (error) {
      console.error('Failed to load discounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getApplicableDiscount = (): ListingDiscount | null => {
    if (nights >= 28) {
      return discounts.find((d) => d.discount_type === 'monthly' && d.enabled) || null;
    }
    if (nights >= 7) {
      return discounts.find((d) => d.discount_type === 'weekly' && d.enabled) || null;
    }
    return null;
  };

  const applicableDiscount = getApplicableDiscount();
  const subtotal = basePrice * nights;
  const discountAmount = applicableDiscount
    ? (subtotal * applicableDiscount.percent) / 100
    : 0;
  const total = subtotal - discountAmount;

  return (
    <div className="p-4 border border-gray-200 rounded-lg space-y-2">
      <div className="flex justify-between">
        <span className="text-gray-600">₹{basePrice} × {nights} nights</span>
        <span className="font-semibold">₹{subtotal}</span>
      </div>

      {applicableDiscount && (
        <div className="flex justify-between text-green-600">
          <span>Discount ({applicableDiscount.percent}%)</span>
          <span>-₹{discountAmount}</span>
        </div>
      )}

      <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
        <span>Total</span>
        <span>₹{total}</span>
      </div>
    </div>
  );
}
```

## Example 4: Addon Selection in Booking

```tsx
'use client';

import { useEffect, useState } from 'react';
import { ListingAddon } from '@/lib/services/addons';
import { Checkbox } from '@/components/ui/checkbox';

interface AddonSelectionProps {
  listingId: number;
  guests: number;
  nights: number;
  onAddonsChange?: (selectedIds: number[], total: number) => void;
}

export default function AddonSelection({
  listingId,
  guests,
  nights,
  onAddonsChange,
}: AddonSelectionProps) {
  const [addons, setAddons] = useState<ListingAddon[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAddons();
  }, [listingId]);

  useEffect(() => {
    const total = selectedAddonIds.reduce((sum, id) => {
      const addon = addons.find((a) => a.id === id);
      return sum + (addon ? addon.price * guests * nights : 0);
    }, 0);
    onAddonsChange?.(selectedAddonIds, total);
  }, [selectedAddonIds, addons, guests, nights, onAddonsChange]);

  const loadAddons = async () => {
    try {
      const response = await fetch(`/api/host/listings/${listingId}/addons`);
      if (!response.ok) throw new Error('Failed to load addons');
      const data = await response.json();
      setAddons(data.data.selected || []);
    } catch (error) {
      console.error('Failed to load addons:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAddon = (addonId: number) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    );
  };

  if (loading) return <div>Loading add-ons...</div>;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Add Services</h3>
      {addons.length === 0 ? (
        <p className="text-sm text-gray-600">No add-ons available</p>
      ) : (
        <div className="space-y-3">
          {addons.map((addon) => {
            const addonTotal = addon.price * guests * nights;
            return (
              <div
                key={addon.id}
                className="p-3 border border-gray-200 rounded-lg flex items-start gap-3 hover:bg-gray-50"
              >
                <Checkbox
                  checked={selectedAddonIds.includes(addon.id)}
                  onChange={() => toggleAddon(addon.id)}
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{addon.addon?.name}</p>
                  <p className="text-sm text-gray-600">{addon.includes}</p>
                  {addon.timing_from && addon.timing_to && (
                    <p className="text-xs text-gray-500">
                      {addon.timing_from} - {addon.timing_to}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₹{addonTotal}</p>
                  <p className="text-xs text-gray-600">
                    ₹{addon.price}/{guests} guests/{nights}n
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

## Example 5: Discount Rules Display

```tsx
'use client';

import { useEffect, useState } from 'react';
import { ListingDiscount } from '@/lib/services/discounts';
import { Info } from 'lucide-react';

interface DiscountRulesProps {
  listingId: number;
}

export default function DiscountRules({ listingId }: DiscountRulesProps) {
  const [discounts, setDiscounts] = useState<ListingDiscount[]>([]);

  useEffect(() => {
    loadDiscounts();
  }, [listingId]);

  const loadDiscounts = async () => {
    try {
      const response = await fetch(
        `/api/host/listings/${listingId}/discounts`
      );
      if (!response.ok) throw new Error('Failed to load discounts');
      const data = await response.json();
      setDiscounts(data.data || []);
    } catch (error) {
      console.error('Failed to load discounts:', error);
    }
  };

  const enabledDiscounts = discounts.filter((d) => d.enabled);

  if (enabledDiscounts.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
      <div className="flex gap-2 items-start">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-blue-900">Available Discounts</h4>
          <p className="text-sm text-blue-800 mt-1">This listing offers:</p>
        </div>
      </div>
      <ul className="space-y-2 ml-7">
        {enabledDiscounts.map((discount) => (
          <li key={discount.id} className="text-sm text-blue-800">
            <span className="font-semibold">{discount.percent}% off</span>
            {' for '}
            {discount.discount_type === 'new_listing' && 'first 3 bookings'}
            {discount.discount_type === 'weekly' && '7+ night stays'}
            {discount.discount_type === 'monthly' && '28+ night stays'}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

These examples show how to integrate the discounts and addons features throughout the application.
