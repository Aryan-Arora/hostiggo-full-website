'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Loader2 } from 'lucide-react';
import WizardShell from '../_components/WizardShell';
import { useListingDraft } from '@/context/ListingDraftContext';
import { toast } from 'sonner';

interface Addon {
  id?: number;
  name: string;
  description: string;
  price: number;
  listing_id?: number;
}

export default function AddonsPage() {
  const { draft } = useListingDraft();
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAddon, setNewAddon] = useState({
    name: '',
    description: '',
    price: 0,
  });

  useEffect(() => {
    loadAddons();
  }, []);

  const loadAddons = async () => {
    if (!draft?.listing_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `/api/host/listings/${draft.listing_id}/addons`
      );

      if (response.ok) {
        const data = await response.json();
        setAddons(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load addons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddon = async () => {
    if (!newAddon.name.trim() || !newAddon.description.trim() || newAddon.price < 0) {
      toast.error('Please fill in all fields with valid values');
      return;
    }

    try {
      const response = await fetch(
        `/api/host/listings/${draft?.listing_id}/addons`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAddon),
        }
      );

      if (!response.ok) throw new Error('Failed to add addon');

      const data = await response.json();
      setAddons([...addons, data.data]);
      setNewAddon({ name: '', description: '', price: 0 });
      toast.success('Add-on created successfully');
    } catch (error) {
      console.error('Error adding addon:', error);
      toast.error('Failed to add add-on');
    }
  };

  const handleDeleteAddon = async (id: number) => {
    try {
      const response = await fetch(
        `/api/host/listings/${draft?.listing_id}/addons/${id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete addon');

      setAddons(addons.filter(a => a.id !== id));
      toast.success('Add-on removed');
    } catch (error) {
      console.error('Error deleting addon:', error);
      toast.error('Failed to delete add-on');
    }
  };

  return (
    <WizardShell
      step={11}
      title="Add extra services (Optional)"
      subtitle="Offer add-ons like airport transfers, breakfast, or cleaning for additional income."
      nextLabel="Finish Creating Listing"
    >
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Add New Addon Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Add a Service</h3>
            <p className="text-sm text-gray-600">Guests can add these services to their booking</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Service Name
              </label>
              <input
                type="text"
                value={newAddon.name}
                onChange={(e) =>
                  setNewAddon(prev => ({
                    ...prev,
                    name: e.target.value
                  }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., Airport Transfer, Breakfast, Extra Cleaning"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={newAddon.description}
                onChange={(e) =>
                  setNewAddon(prev => ({
                    ...prev,
                    description: e.target.value
                  }))
                }
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder="Describe what this service includes..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price per service (₹)
              </label>
              <input
                type="number"
                min="0"
                value={newAddon.price}
                onChange={(e) =>
                  setNewAddon(prev => ({
                    ...prev,
                    price: parseInt(e.target.value) || 0
                  }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., 500"
              />
            </div>
          </div>

          <button
            onClick={handleAddAddon}
            className="w-full px-4 py-3 bg-blue-100 text-blue-600 rounded-lg font-semibold hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Service
          </button>
        </div>

        {/* Current Addons */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : addons.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-900">Your Services</h3>
            {addons.map((addon) => (
              <div
                key={addon.id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{addon.name}</p>
                      <p className="text-sm text-gray-600">{addon.description}</p>
                      <p className="text-sm font-bold text-blue-600 mt-1">₹{addon.price}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => addon.id && handleDeleteAddon(addon.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 text-center">
            <Package className="w-12 h-12 text-blue-600 mx-auto mb-3 opacity-50" />
            <p className="text-gray-700 font-medium">No services yet</p>
            <p className="text-sm text-gray-600 mt-1">Add services to increase your earnings per booking</p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 space-y-2">
          <p className="text-sm font-semibold text-blue-900">💡 Popular Add-ons</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Airport/Railway transfers (₹500-1500)</li>
            <li>• Breakfast service (₹200-500)</li>
            <li>• Late check-out (₹300-1000)</li>
            <li>• Laundry/Cleaning (₹200-800)</li>
            <li>• Activity bookings (varies)</li>
          </ul>
        </div>
      </div>
    </WizardShell>
  );
}
