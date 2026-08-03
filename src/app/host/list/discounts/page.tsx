'use client';

import { useState, useEffect } from 'react';
import { Percent, Plus, Trash2, Loader2 } from 'lucide-react';
import WizardShell from '../_components/WizardShell';
import { useListingDraft } from '@/context/ListingDraftContext';
import { toast } from 'sonner';

interface Discount {
  id?: number;
  min_nights: number;
  discount_percentage: number;
  listing_id?: number;
}

export default function DiscountsPage() {
  const { draft } = useListingDraft();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDiscount, setNewDiscount] = useState({ min_nights: 7, discount_percentage: 10 });

  useEffect(() => {
    loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    if (!draft?.listing_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `/api/host/listings/${draft.listing_id}/discounts`
      );

      if (response.ok) {
        const data = await response.json();
        setDiscounts(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load discounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDiscount = async () => {
    if (newDiscount.min_nights < 1 || newDiscount.discount_percentage < 1) {
      toast.error('Please enter valid values');
      return;
    }

    if (discounts.some(d => d.min_nights === newDiscount.min_nights)) {
      toast.error('This night range already exists');
      return;
    }

    try {
      const response = await fetch(
        `/api/host/listings/${draft?.listing_id}/discounts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newDiscount),
        }
      );

      if (!response.ok) throw new Error('Failed to add discount');

      const data = await response.json();
      setDiscounts([...discounts, data.data]);
      setNewDiscount({ min_nights: 7, discount_percentage: 10 });
      toast.success('Discount added successfully');
    } catch (error) {
      console.error('Error adding discount:', error);
      toast.error('Failed to add discount');
    }
  };

  const handleDeleteDiscount = async (id: number) => {
    try {
      const response = await fetch(
        `/api/host/listings/${draft?.listing_id}/discounts/${id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete discount');

      setDiscounts(discounts.filter(d => d.id !== id));
      toast.success('Discount removed');
    } catch (error) {
      console.error('Error deleting discount:', error);
      toast.error('Failed to delete discount');
    }
  };

  return (
    <WizardShell
      step={10}
      title="Set up discounts (Optional)"
      subtitle="Offer discounts for longer stays to encourage bookings and increase occupancy rates."
      nextLabel="Skip & Continue"
    >
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Add New Discount Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Add a Discount</h3>
            <p className="text-sm text-gray-600">Offer discounts for guests who book longer stays</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Minimum Nights
              </label>
              <input
                type="number"
                min="1"
                value={newDiscount.min_nights}
                onChange={(e) =>
                  setNewDiscount(prev => ({
                    ...prev,
                    min_nights: parseInt(e.target.value) || 1
                  }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., 7"
              />
              <p className="text-xs text-gray-500 mt-2">Number of nights to qualify for discount</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Discount %
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={newDiscount.discount_percentage}
                onChange={(e) =>
                  setNewDiscount(prev => ({
                    ...prev,
                    discount_percentage: parseInt(e.target.value) || 10
                  }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., 10"
              />
              <p className="text-xs text-gray-500 mt-2">Percentage off the nightly rate</p>
            </div>
          </div>

          <button
            onClick={handleAddDiscount}
            className="w-full px-4 py-3 bg-blue-100 text-blue-600 rounded-lg font-semibold hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Discount
          </button>
        </div>

        {/* Current Discounts */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : discounts.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-900">Your Discounts</h3>
            {discounts.map((discount) => (
              <div
                key={discount.id}
                className="bg-gray-50 rounded-lg p-4 flex items-center justify-between border border-gray-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Percent className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {discount.discount_percentage}% off
                    </p>
                    <p className="text-sm text-gray-600">
                      For stays of {discount.min_nights}+ nights
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => discount.id && handleDeleteDiscount(discount.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 text-center">
            <Percent className="w-12 h-12 text-blue-600 mx-auto mb-3 opacity-50" />
            <p className="text-gray-700 font-medium">No discounts yet</p>
            <p className="text-sm text-gray-600 mt-1">Add your first discount to encourage longer bookings</p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 space-y-2">
          <p className="text-sm font-semibold text-blue-900">💡 Pro Tip</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Offer 10-15% off for 7-day stays</li>
            <li>• Offer 20-25% off for 30-day stays</li>
            <li>• Longer discounts encourage stable, quality bookings</li>
          </ul>
        </div>
      </div>
    </WizardShell>
  );
}
