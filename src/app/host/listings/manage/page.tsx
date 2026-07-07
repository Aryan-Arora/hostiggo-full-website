'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, MapPin } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import HostDashboardShell from '../../_components/HostDashboardShell';
import { useAuth } from '@/context/AuthContext';
import HouseRulesForm from '@/components/features/HouseRulesForm';
import SafetyDetailsForm from '@/components/features/SafetyDetailsForm';
import AddonsForm from '@/components/features/AddonsForm';
import DiscountsForm from '@/components/features/DiscountsForm';

interface ListingDetails {
  listing_id: number;
  title: string;
  description: string;
  price_weekday: number;
  price_weekend: number;
  num_guests: number;
  num_bedrooms: number;
  num_beds: number;
  num_bathrooms: number;
  address_line1: string;
  address_line2: string;
  landmark: string;
  location_id: number;
  property_type_id: number;
}

interface Location {
  location_id: number;
  state: string;
  district: string;
  lower_division_name: string;
  pincode: string;
}

export default function ManageListingPage() {
  const { userId } = useAuth();
  const searchParams = useSearchParams();
  const listingId = searchParams.get('id');

  const [listing, setListing] = useState<ListingDetails | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ListingDetails | null>(null);

  useEffect(() => {
    if (!listingId || !userId) return;
    loadListing();
    loadLocations();
  }, [listingId, userId]);

  const loadListing = async () => {
    if (!listingId || !userId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/hotels/${encodeURIComponent(listingId)}?userId=${encodeURIComponent(userId)}`,
      );
      if (!res.ok) throw new Error('Failed to load listing');

      const { data } = await res.json();
      setListing(data);
      setFormData(data);
    } catch (err) {
      console.error('Failed to load listing:', err);
      toast.error('Failed to load listing details');
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    setLocationsLoading(true);
    try {
      const res = await fetch('/api/locations');
      if (!res.ok) throw new Error('Failed to load locations');

      const { data } = await res.json();
      setLocations(data || []);
    } catch (err) {
      console.error('Failed to load locations:', err);
      toast.error('Failed to load locations');
    } finally {
      setLocationsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData || !listingId) {
      toast.error('Listing data missing');
      return;
    }

    setSaving(true);
    try {
      console.log('Saving listing:', { listingId, formData });

      const res = await fetch('/api/host/listings/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: parseInt(listingId),
          title: formData.title,
          description: formData.description,
          price_weekday: formData.price_weekday,
          price_weekend: formData.price_weekend,
          num_guests: formData.num_guests,
          num_bedrooms: formData.num_bedrooms,
          num_beds: formData.num_beds,
          num_bathrooms: formData.num_bathrooms,
          location_id: formData.location_id,
          address_line1: formData.address_line1,
          address_line2: formData.address_line2,
          landmark: formData.landmark,
        }),
      });

      console.log('Save response status:', res.status);
      const responseData = await res.json();
      console.log('Save response data:', responseData);

      if (!res.ok) {
        const error = responseData.error || 'Failed to save listing';
        throw new Error(error);
      }

      toast.success('Listing updated successfully!');
      
      // Reload the listing to get fresh data from database
      await loadListing();
    } catch (err) {
      console.error('Save error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <HostDashboardShell active="listings">
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </HostDashboardShell>
    );
  }

  if (!listing) {
    return (
      <HostDashboardShell active="listings">
        <div className="bg-white rounded-2xl p-8 text-center">
          <p className="text-gray-500">Listing not found</p>
          <Link href="/host/listings" className="text-blue-600 mt-4 inline-block">
            Back to Listings
          </Link>
        </div>
      </HostDashboardShell>
    );
  }

  const selectedLocation = formData?.location_id
    ? locations.find((l) => l.location_id === formData.location_id)
    : null;

  return (
    <HostDashboardShell active="listings">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/host/listings"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-blue-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Listing</h1>
            <p className="text-sm text-gray-500">{formData?.title || 'Untitled listing'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/host/listings"
            className="px-6 py-2.5 text-blue-600 border border-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-200 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Basic Information</h2>

            <div>
              <label className="text-sm font-bold text-gray-600 block mb-2">Title</label>
              <input
                type="text"
                value={formData?.title || ''}
                onChange={(e) =>
                  setFormData((prev) => prev ? { ...prev, title: e.target.value } : null)
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="e.g., Cozy Studio in Downtown"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-600 block mb-2">Description</label>
              <textarea
                value={formData?.description || ''}
                onChange={(e) =>
                  setFormData((prev) => prev ? { ...prev, description: e.target.value } : null)
                }
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                placeholder="Describe your listing..."
              />
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-200 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Location</h2>

            {/* Location dropdown */}
            <div>
              <label className="text-sm font-bold text-gray-600 block mb-2">Select Location</label>
              <select
                value={formData?.location_id || ''}
                onChange={(e) => {
                  const locId = parseInt(e.target.value);
                  setFormData((prev) =>
                    prev ? { ...prev, location_id: locId } : null,
                  );
                }}
                disabled={locationsLoading}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
              >
                <option value="">
                  {locationsLoading ? 'Loading locations...' : 'Select a location'}
                </option>
                {locations.map((loc) => (
                  <option key={loc.location_id} value={loc.location_id}>
                    {loc.state} • {loc.district} • {loc.lower_division_name} • {loc.pincode}
                  </option>
                ))}
              </select>
            </div>

            {/* Location preview */}
            {selectedLocation && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
                <p className="text-sm font-semibold text-blue-900">Selected Location</p>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><span className="font-medium">State:</span> {selectedLocation.state}</p>
                  <p><span className="font-medium">District:</span> {selectedLocation.district}</p>
                  <p><span className="font-medium">Area:</span> {selectedLocation.lower_division_name}</p>
                  <p><span className="font-medium">Pincode:</span> {selectedLocation.pincode}</p>
                </div>
              </div>
            )}

            {/* Google Maps Preview */}
            {selectedLocation && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">Map Preview</p>
                <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100 h-80">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyDy0EQmM0GDq5QNHB72RP4sRh8eTLmFY68&q=${encodeURIComponent(
                      `${selectedLocation.lower_division_name}, ${selectedLocation.district}, ${selectedLocation.state}`
                    )}&zoom=15`}
                  />
                </div>
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(
                    `${selectedLocation.lower_division_name}, ${selectedLocation.district}, ${selectedLocation.state}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 text-sm font-medium hover:underline"
                >
                  <MapPin className="w-4 h-4" />
                  View on Google Maps
                </a>
              </div>
            )}

            {!selectedLocation && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center py-12">
                <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Select a location to preview map</p>
              </div>
            )}

            <div>
              <label className="text-sm font-bold text-gray-600 block mb-2">Address Line 1</label>
              <input
                type="text"
                value={formData?.address_line1 || ''}
                onChange={(e) =>
                  setFormData((prev) => prev ? { ...prev, address_line1: e.target.value } : null)
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="Street address"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-600 block mb-2">Address Line 2</label>
              <input
                type="text"
                value={formData?.address_line2 || ''}
                onChange={(e) =>
                  setFormData((prev) => prev ? { ...prev, address_line2: e.target.value } : null)
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="Apt, suite, etc. (optional)"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-600 block mb-2">Landmark</label>
              <input
                type="text"
                value={formData?.landmark || ''}
                onChange={(e) =>
                  setFormData((prev) => prev ? { ...prev, landmark: e.target.value } : null)
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="e.g., Near Central Park"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-200 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Pricing</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-600 block mb-2">Weekday (₹/night)</label>
                <input
                  type="number"
                  value={formData?.price_weekday || 0}
                  onChange={(e) =>
                    setFormData((prev) =>
                      prev ? { ...prev, price_weekday: parseInt(e.target.value) || 0 } : null,
                    )
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-600 block mb-2">Weekend (₹/night)</label>
                <input
                  type="number"
                  value={formData?.price_weekend || 0}
                  onChange={(e) =>
                    setFormData((prev) =>
                      prev ? { ...prev, price_weekend: parseInt(e.target.value) || 0 } : null,
                    )
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Discounts */}
          {listingId && (
            <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-200">
              <DiscountsForm listingId={parseInt(listingId)} />
            </div>
          )}

          {/* Addons */}
          {listingId && (
            <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-200">
              <AddonsForm listingId={parseInt(listingId)} />
            </div>
          )}

          {/* House Rules */}
          {listingId && (
            <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-200">
              <HouseRulesForm listingId={parseInt(listingId)} />
            </div>
          )}

          {/* Safety Details */}
          {listingId && (
            <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-200">
              <SafetyDetailsForm listingId={parseInt(listingId)} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Capacity */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-200 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Capacity</h2>

            <div className="space-y-3">
              {[
                { label: 'Max Guests', key: 'num_guests' },
                { label: 'Bedrooms', key: 'num_bedrooms' },
                { label: 'Total Beds', key: 'num_beds' },
                { label: 'Bathrooms', key: 'num_bathrooms' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="text-sm font-bold text-gray-600 block mb-2">{label}</label>
                  <input
                    type="number"
                    value={formData?.[key as keyof ListingDetails] || 0}
                    onChange={(e) =>
                      setFormData((prev) =>
                        prev
                          ? {
                              ...prev,
                              [key]: parseInt(e.target.value) || 0,
                            }
                          : null,
                      )
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    min="0"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 space-y-3">
            <h3 className="font-bold text-blue-900">Summary</h3>
            <div className="text-sm space-y-2 text-blue-800">
              <p>
                <span className="font-semibold">{formData?.num_guests}</span> guests •{' '}
                <span className="font-semibold">{formData?.num_bedrooms}</span> bedrooms
              </p>
              <p className="text-lg font-bold text-blue-900">
                ₹{(formData?.price_weekday || 0).toLocaleString('en-IN')}/night
              </p>
              {selectedLocation && (
                <p className="text-xs text-blue-700 pt-2 border-t border-blue-200">
                  📍 {selectedLocation.state}, {selectedLocation.district}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </HostDashboardShell>
  );
}
