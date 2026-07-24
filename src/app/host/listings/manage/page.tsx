'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  ImageIcon,
  DollarSign,
  Percent,
  Package,
  Home,
  Shield,
  MapPinIcon,
  Building2,
  Pause,
  Trash2,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import HostDashboardShell from '../../_components/HostDashboardShell';
import { useAuth } from '@/context/AuthContext';
import HouseRulesForm from '@/components/features/HouseRulesForm';
import SafetyDetailsForm from '@/components/features/SafetyDetailsForm';
import AddonsForm from '@/components/features/AddonsForm';
import DiscountsForm from '@/components/features/DiscountsForm';
import { cn } from '@/lib/utils';

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
  is_active?: boolean;
}

interface Location {
  location_id: number;
  state: string;
  district: string;
  lower_division_name: string;
  pincode: string;
}

type SectionType = 
  | 'overview' 
  | 'description' 
  | 'pricing' 
  | 'discounts' 
  | 'addons' 
  | 'house-rules' 
  | 'safety' 
  | 'location' 
  | 'capacity';

const SECTIONS: { id: SectionType; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Listing Title', icon: <FileText className="w-5 h-5" /> },
  { id: 'description', label: 'Description', icon: <FileText className="w-5 h-5" /> },
  { id: 'pricing', label: 'Base & Weekend Price', icon: <DollarSign className="w-5 h-5" /> },
  { id: 'discounts', label: 'Discounts', icon: <Percent className="w-5 h-5" /> },
  { id: 'addons', label: 'Add-ons', icon: <Package className="w-5 h-5" /> },
  { id: 'house-rules', label: 'House Rules', icon: <Home className="w-5 h-5" /> },
  { id: 'safety', label: 'Safety Details', icon: <Shield className="w-5 h-5" /> },
  { id: 'location', label: 'Location', icon: <MapPinIcon className="w-5 h-5" /> },
  { id: 'capacity', label: 'Room & Capacity', icon: <Building2 className="w-5 h-5" /> },
];

export default function ManageListingPage() {
  const { userId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get('id');

  const [listing, setListing] = useState<ListingDetails | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [formData, setFormData] = useState<ListingDetails | null>(null);
  const [activeSection, setActiveSection] = useState<SectionType>('overview');

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
    if (!formData || !listingId || !userId) {
      toast.error('Listing data missing');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/host/listings/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: parseInt(listingId),
          userId,
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

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save listing');
      }

      toast.success('Listing updated successfully!');
      await loadListing();
    } catch (err) {
      console.error('Save error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePause = async () => {
    if (!listingId || !formData || !userId) return;
    setPausing(true);
    try {
      const res = await fetch('/api/host/listings/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: parseInt(listingId), isActive: !formData.is_active, userId }),
      });
      if (!res.ok) throw new Error('Failed to update listing status');
      const { data } = await res.json();
      setFormData((prev) => (prev ? { ...prev, is_active: data.isActive } : prev));
      setListing((prev) => (prev ? { ...prev, is_active: data.isActive } : prev));
      toast.success(data.isActive ? 'Listing is now live!' : 'Listing paused');
    } catch (err) {
      console.error('Toggle pause error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update listing status');
    } finally {
      setPausing(false);
    }
  };

  const handleRemove = async () => {
    if (!listingId) return;
    if (
      !window.confirm(
        'Remove this listing permanently? This cannot be undone. Listings with existing bookings can\'t be removed -- pause them instead.',
      )
    ) {
      return;
    }
    setRemoving(true);
    try {
      const res = await fetch(`/api/host/listings/${encodeURIComponent(listingId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to remove listing');
      }
      toast.success('Listing removed.');
      router.push('/host/listings');
    } catch (err) {
      console.error('Remove listing error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to remove listing');
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <HostDashboardShell active="listings">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-figma-navy" />
        </div>
      </HostDashboardShell>
    );
  }

  if (!listing) {
    return (
      <HostDashboardShell active="listings">
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">Listing not found</p>
          <Link href="/host/listings" className="text-figma-navy hover:underline">
            Back to Listings
          </Link>
        </div>
      </HostDashboardShell>
    );
  }

  const selectedLocation = locations.find((l) => l.location_id === formData?.location_id);

  return (
    <HostDashboardShell active="listings">
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <Link
              href="/host/listings"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Edit Listing</h1>
              <p className="text-sm text-gray-500">{formData?.title || 'Loading...'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {formData && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100">
                <span className={cn('w-2 h-2 rounded-full', formData.is_active ? 'bg-green-500' : 'bg-gray-400')} />
                <span className="text-xs font-semibold text-gray-700">
                  {formData.is_active ? 'Live' : 'Paused'}
                </span>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-figma-navy text-white rounded-lg font-semibold hover:bg-figma-navy/90 disabled:opacity-60 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
            {/* Listing Preview Card - Sticky */}
            <div className="sticky top-0 p-4 bg-gradient-to-b from-white to-gray-50 border-b border-gray-200 z-10">
              <div className="space-y-3">
                <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-2">
                    {formData?.title || 'Untitled Listing'}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {selectedLocation?.district && selectedLocation?.state && (
                      <>
                        {selectedLocation.district}, {selectedLocation.state}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-600">Base Price</p>
                    <p className="text-base font-bold text-figma-navy">
                      ₹{formData?.price_weekday?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Weekend</p>
                    <p className="text-base font-bold text-figma-navy">
                      ₹{formData?.price_weekend?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Navigation */}
            <nav className="p-3 space-y-1">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all text-left',
                    activeSection === section.id
                      ? 'bg-figma-navy/10 text-figma-navy'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className={activeSection === section.id ? 'text-figma-navy' : 'text-gray-500'}>
                      {section.icon}
                    </span>
                    <span className="font-medium text-sm">{section.label}</span>
                  </div>
                  {activeSection === section.id && (
                    <ChevronRight className="w-4 h-4 text-figma-navy" />
                  )}
                </button>
              ))}

              {/* Divider */}
              <div className="my-4 border-t border-gray-200" />

              {/* Listing Status Section */}
              <div className="space-y-1">
                <button
                  onClick={handleTogglePause}
                  disabled={pausing || removing}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Pause className="w-5 h-5" />
                  <span className="font-medium text-sm">
                    {pausing ? 'Updating...' : formData?.is_active ? 'Pause listing' : 'Reactivate listing'}
                  </span>
                </button>
                <button
                  onClick={handleRemove}
                  disabled={removing || pausing}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="font-medium text-sm">{removing ? 'Removing...' : 'Remove Listing'}</span>
                </button>
              </div>
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto p-8">
              <SectionRenderer
                section={activeSection}
                formData={formData}
                setFormData={setFormData}
                locations={locations}
                locationsLoading={locationsLoading}
                selectedLocation={selectedLocation}
                listingId={listingId ? parseInt(listingId) : 0}
              />
            </div>
          </div>
        </div>
      </div>
    </HostDashboardShell>
  );
}


/**
 * Render the appropriate section based on activeSection
 */
function SectionRenderer({
  section,
  formData,
  setFormData,
  locations,
  locationsLoading,
  selectedLocation,
  listingId,
}: {
  section: SectionType;
  formData: any;
  setFormData: any;
  locations: any[];
  locationsLoading: boolean;
  selectedLocation: any;
  listingId: number;
}) {
  const inputClasses = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-figma-navy outline-none text-base';
  const labelClasses = 'block text-sm font-semibold text-gray-700 mb-2';

  const sectionConfig: Record<SectionType, { title: string; description: string }> = {
    overview: {
      title: 'Listing Title',
      description: 'Give your listing a clear, attractive title that stands out',
    },
    description: {
      title: 'Description',
      description: 'Tell guests about your property in detail - what makes it special',
    },
    pricing: {
      title: 'Base & Weekend Price',
      description: 'Set your nightly rates for weekdays and weekends',
    },
    discounts: {
      title: 'Discounts',
      description: 'Offer discounts to encourage longer stays and bookings',
    },
    addons: {
      title: 'Add-ons',
      description: 'Offer additional services for extra income',
    },
    'house-rules': {
      title: 'House Rules',
      description: 'Set clear expectations and guidelines for your guests',
    },
    safety: {
      title: 'Safety Details',
      description: 'Highlight safety features and build trust with guests',
    },
    location: {
      title: 'Location',
      description: 'Help guests find your property with address details',
    },
    capacity: {
      title: 'Room & Capacity',
      description: 'Define your property specifications and room details',
    },
  };

  const config = sectionConfig[section];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{config.title}</h2>
        <p className="text-gray-600">{config.description}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {section === 'overview' && (
          <div>
            <label className={labelClasses}>Listing Title</label>
            <input
              type="text"
              value={formData?.title || ''}
              onChange={(e) =>
                setFormData((prev: any) => prev ? { ...prev, title: e.target.value } : null)
              }
              className={inputClasses}
              placeholder="e.g., Cozy Studio in Downtown"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-2">
              {formData?.title?.length || 0} / 100 characters
            </p>
          </div>
        )}

        {section === 'description' && (
          <div>
            <label className={labelClasses}>Description</label>
            <textarea
              value={formData?.description || ''}
              onChange={(e) =>
                setFormData((prev: any) => prev ? { ...prev, description: e.target.value } : null)
              }
              rows={8}
              className={cn(inputClasses, 'resize-none')}
              placeholder="Describe your listing, amenities, and what makes it special..."
              maxLength={5000}
            />
            <p className="text-xs text-gray-500 mt-2">
              {formData?.description?.length || 0} / 5000 characters
            </p>
          </div>
        )}

        {section === 'pricing' && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className={labelClasses}>Weekday Price (₹/night)</label>
              <input
                type="number"
                value={formData?.price_weekday || 0}
                onChange={(e) =>
                  setFormData((prev: any) =>
                    prev ? { ...prev, price_weekday: parseInt(e.target.value) || 0 } : null
                  )
                }
                className={inputClasses}
                min="0"
              />
            </div>
            <div>
              <label className={labelClasses}>Weekend Price (₹/night)</label>
              <input
                type="number"
                value={formData?.price_weekend || 0}
                onChange={(e) =>
                  setFormData((prev: any) =>
                    prev ? { ...prev, price_weekend: parseInt(e.target.value) || 0 } : null
                  )
                }
                className={inputClasses}
                min="0"
              />
            </div>
          </div>
        )}

        {section === 'discounts' && listingId ? (
          <DiscountsForm listingId={listingId} />
        ) : null}

        {section === 'addons' && listingId ? (
          <AddonsForm listingId={listingId} />
        ) : null}

        {section === 'house-rules' && listingId ? (
          <HouseRulesForm listingId={listingId} />
        ) : null}

        {section === 'safety' && listingId ? (
          <SafetyDetailsForm listingId={listingId} />
        ) : null}

        {section === 'location' && (
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>Select Location</label>
              <select
                value={formData?.location_id || ''}
                onChange={(e) => {
                  const locId = parseInt(e.target.value);
                  setFormData((prev: any) =>
                    prev ? { ...prev, location_id: locId } : null
                  );
                }}
                disabled={locationsLoading}
                className={cn(inputClasses, 'bg-white')}
              >
                <option value="">
                  {locationsLoading ? 'Loading locations...' : 'Select a location'}
                </option>
                {locations.map((loc) => (
                  <option key={loc.location_id} value={loc.location_id}>
                    {loc.state} • {loc.district} • {loc.lower_division_name}
                  </option>
                ))}
              </select>
            </div>

            {selectedLocation && (
              <>
                <div className="p-4 bg-figma-navy/5 rounded-lg border border-figma-navy/30">
                  <p className="text-sm font-semibold text-figma-navy mb-2">📍 Selected Location</p>
                  <div className="space-y-1 text-sm text-figma-navy">
                    <p><strong>State:</strong> {selectedLocation.state}</p>
                    <p><strong>District:</strong> {selectedLocation.district}</p>
                    <p><strong>Area:</strong> {selectedLocation.lower_division_name}</p>
                    <p><strong>Pincode:</strong> {selectedLocation.pincode}</p>
                  </div>
                </div>

                <div>
                  <label className={labelClasses}>Address Line 1</label>
                  <input
                    type="text"
                    value={formData?.address_line1 || ''}
                    onChange={(e) =>
                      setFormData((prev: any) =>
                        prev ? { ...prev, address_line1: e.target.value } : null
                      )
                    }
                    className={inputClasses}
                    placeholder="Street address"
                  />
                </div>

                <div>
                  <label className={labelClasses}>Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    value={formData?.address_line2 || ''}
                    onChange={(e) =>
                      setFormData((prev: any) =>
                        prev ? { ...prev, address_line2: e.target.value } : null
                      )
                    }
                    className={inputClasses}
                    placeholder="Apt, suite, etc."
                  />
                </div>

                <div>
                  <label className={labelClasses}>Landmark (Optional)</label>
                  <input
                    type="text"
                    value={formData?.landmark || ''}
                    onChange={(e) =>
                      setFormData((prev: any) =>
                        prev ? { ...prev, landmark: e.target.value } : null
                      )
                    }
                    className={inputClasses}
                    placeholder="e.g., Near Central Park"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {section === 'capacity' && (
          <div className="grid grid-cols-2 gap-6">
            {[
              { label: 'Max Guests', key: 'num_guests' },
              { label: 'Bedrooms', key: 'num_bedrooms' },
              { label: 'Total Beds', key: 'num_beds' },
              { label: 'Bathrooms', key: 'num_bathrooms' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className={labelClasses}>{label}</label>
                <input
                  type="number"
                  value={formData?.[key as keyof typeof formData] || 0}
                  onChange={(e) =>
                    setFormData((prev: any) =>
                      prev
                        ? {
                            ...prev,
                            [key]: parseInt(e.target.value) || 0,
                          }
                        : null
                    )
                  }
                  className={inputClasses}
                  min="0"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
