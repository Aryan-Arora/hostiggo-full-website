'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Addon, ListingAddon, groupAddonsByCategory } from '@/lib/services/addons';
import { cn } from '@/lib/utils';
import { ChevronDown, Loader2, Trash2 } from 'lucide-react';

interface AddonsFormProps {
  listingId: number;
  onSave?: () => void;
}

export default function AddonsForm({ listingId, onSave }: AddonsFormProps) {
  const { userId } = useAuth();
  const [allAddons, setAllAddons] = useState<Addon[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<ListingAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedAddon, setExpandedAddon] = useState<number | null>(null);
  const [formData, setFormData] = useState<Record<number, Partial<ListingAddon>>>({});

  // Load addons on mount
  useEffect(() => {
    loadAddons();
  }, [listingId]);

  const loadAddons = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/host/listings/${listingId}/addons`);
      if (!response.ok) throw new Error('Failed to load addons');
      const data = await response.json();
      setAllAddons(data.data.available || []);
      setSelectedAddons(data.data.selected || []);
      setFormData({});
      setExpandedAddon(null);
    } catch (error) {
      console.error('Failed to load addons:', error);
      toast.error('Failed to load addons');
    } finally {
      setLoading(false);
    }
  };

  const isAddonSelected = (addonId: number): boolean => {
    return selectedAddons.some((sa) => sa.addon_id === addonId);
  };

  const handleToggleAddon = (addon: Addon) => {
    if (isAddonSelected(addon.addon_id)) {
      // Remove addon
      const selected = selectedAddons.find((sa) => sa.addon_id === addon.addon_id);
      if (selected) {
        removeAddon(selected.id);
      }
    } else {
      // Add addon with default values
      setFormData((prev) => ({
        ...prev,
        [addon.addon_id]: {
          addon_id: addon.addon_id,
          price: 0,
          includes: '',
          timing_from: null,
          timing_to: null,
          another_details: null,
          additional_notes: '',
        },
      }));
      setExpandedAddon(addon.addon_id);
    }
  };

  const handleFormChange = (
    addonId: number,
    field: string,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [addonId]: {
        ...prev[addonId],
        [field]: value,
      },
    }));
  };

  const addAddon = async (addonId: number) => {
    try {
      const data = formData[addonId];
      if (!data || !data.includes) {
        toast.error('Please fill in required fields');
        return;
      }

      setSaving(true);
      const response = await fetch(`/api/host/listings/${listingId}/addons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addon_id: addonId,
          price: data.price || 0,
          includes: data.includes,
          timing_from: data.timing_from || null,
          timing_to: data.timing_to || null,
          another_details: data.another_details || null,
          additional_notes: data.additional_notes || '',
          userId,
        }),
      });

      if (!response.ok) throw new Error('Failed to add addon');
      toast.success('Addon added successfully');
      setFormData((prev) => {
        const newData = { ...prev };
        delete newData[addonId];
        return newData;
      });
      await loadAddons();
      onSave?.();
    } catch (error) {
      console.error('Failed to add addon:', error);
      toast.error('Failed to add addon');
    } finally {
      setSaving(false);
    }
  };

  const removeAddon = async (addonListingId: number) => {
    try {
      setSaving(true);
      const response = await fetch(
        `/api/host/listings/${listingId}/addons/${addonListingId}?userId=${encodeURIComponent(userId ?? '')}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to remove addon');
      toast.success('Addon removed');
      await loadAddons();
      onSave?.();
    } catch (error) {
      console.error('Failed to remove addon:', error);
      toast.error('Failed to remove addon');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const grouped = groupAddonsByCategory(allAddons);
  const categories = Object.keys(grouped).sort();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Service Add-ons (optional)
        </h3>
        <p className="text-sm text-gray-600">
          You can earn more by providing some services to guests. You can change add-ons prices
        </p>
      </div>

      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category}>
            <h4 className="font-semibold text-gray-900 mb-3 text-sm">{category}</h4>
            <div className="space-y-2">
              {grouped[category].map((addon) => {
                const selected = selectedAddons.find((sa) => sa.addon_id === addon.addon_id);
                const isExpanded = expandedAddon === addon.addon_id;
                const formValues = formData[addon.addon_id];

                return (
                  <div key={addon.addon_id} className="space-y-2">
                    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={!!selected || !!formValues}
                        onChange={() => handleToggleAddon(addon)}
                        className="w-5 h-5 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{addon.name}</p>
                      </div>
                      {(selected || formValues) && (
                        <button
                          onClick={() =>
                            setExpandedAddon(isExpanded ? null : addon.addon_id)
                          }
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <ChevronDown
                            className={cn(
                              'w-4 h-4 text-gray-600 transition-transform',
                              isExpanded && 'rotate-180'
                            )}
                          />
                        </button>
                      )}
                    </div>

                    {/* Expanded form */}
                    {(isExpanded || formValues) && (
                      <div className="ml-8 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                        {/* Price */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">₹</span>
                            <input
                              type="number"
                              value={formValues?.price || (selected?.price ?? 0)}
                              onChange={(e) =>
                                handleFormChange(
                                  addon.addon_id,
                                  'price',
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              min="0"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                            <span className="text-gray-600 text-sm">/ person / day</span>
                          </div>
                        </div>

                        {/* Includes */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Includes <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Tea and sandwiches"
                            value={formValues?.includes || (selected?.includes ?? '')}
                            onChange={(e) =>
                              handleFormChange(addon.addon_id, 'includes', e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                        </div>

                        {/* Timing */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              From Time
                            </label>
                            <input
                              type="time"
                              value={formValues?.timing_from || (selected?.timing_from ?? '')}
                              onChange={(e) =>
                                handleFormChange(addon.addon_id, 'timing_from', e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              To Time
                            </label>
                            <input
                              type="time"
                              value={formValues?.timing_to || (selected?.timing_to ?? '')}
                              onChange={(e) =>
                                handleFormChange(addon.addon_id, 'timing_to', e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Additional Notes
                          </label>
                          <textarea
                            placeholder="Any additional information about this addon..."
                            value={formValues?.additional_notes || (selected?.additional_notes ?? '')}
                            onChange={(e) =>
                              handleFormChange(addon.addon_id, 'additional_notes', e.target.value)
                            }
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 pt-2">
                          {formValues && !selected ? (
                            <>
                              <button
                                onClick={() => addAddon(addon.addon_id)}
                                disabled={saving}
                                className="flex-1 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                                Add Addon
                              </button>
                              <button
                                onClick={() => handleToggleAddon(addon)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded hover:bg-gray-100"
                              >
                                Cancel
                              </button>
                            </>
                          ) : selected ? (
                            <button
                              onClick={() => removeAddon(selected.id)}
                              disabled={saving}
                              className="w-full py-2 bg-red-50 text-red-600 text-sm font-semibold rounded hover:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </button>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedAddons.length === 0 && Object.keys(formData).length === 0 && (
        <p className="text-center text-sm text-gray-500 py-4">
          No addons selected. You can add them later from your listing management.
        </p>
      )}
    </div>
  );
}
