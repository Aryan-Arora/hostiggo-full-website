'use client';

import { ShieldCheck, Pin } from 'lucide-react';
import WizardShell from '../_components/WizardShell';
import { useListingDraft } from '@/context/ListingDraftContext';
import { useState, useEffect } from 'react';
import AddressSearch from '../_components/AddressSearch';
import MapPicker from '../_components/MapPicker';
import { reverseGeocode } from '@/lib/services/geocoding';
import { api } from '@/lib/api';

// Matches the geocoded city/district against the platform's curated
// locations table (the same lookup the destination search bar uses) so the
// listing gets tagged with a real location_id instead of silently staying
// unset. Best-effort: many towns genuinely aren't in that curated list yet,
// so no match just means no location_id (shows as "Location pending"),
// which is honest -- not a case to fake a wrong location for.
async function resolveLocationId(city?: string, county?: string): Promise<number | undefined> {
  for (const candidate of [city, county]) {
    if (!candidate) continue;
    try {
      const results = await api.locations(1, candidate);
      if (results?.[0]?.location_id) return results[0].location_id;
    } catch {
      // Non-fatal -- listing creation shouldn't fail because location
      // lookup failed.
    }
  }
  return undefined;
}

export default function LocationPage() {
  const { draft, update } = useListingDraft();
  const [address, setAddress] = useState(draft.addressLine1 || '');
  const [latitude, setLatitude] = useState<number>(draft.latitude || 28.6139);
  const [longitude, setLongitude] = useState<number>(draft.longitude || 77.209);
  const [displayAddress, setDisplayAddress] = useState('');

  // Load initial address if coordinates exist
  useEffect(() => {
    const loadInitialAddress = async () => {
      if (draft.latitude && draft.longitude && !draft.addressLine1) {
        const result = await reverseGeocode(draft.latitude, draft.longitude);
        if (result) {
          setDisplayAddress(result.displayName);
          setAddress(result.displayName);
        }
      }
      // A draft can already have coordinates (e.g. resumed from
      // localStorage, saved before this lookup existed) without a
      // locationId -- backfill it instead of leaving it stuck unset.
      if (draft.latitude && draft.longitude && !draft.locationId) {
        const result = await reverseGeocode(draft.latitude, draft.longitude);
        const locationId = await resolveLocationId(result?.address.city, result?.address.county);
        if (locationId) update({ locationId });
      }
    };
    loadInitialAddress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.latitude, draft.longitude]);

  // Auto-detect the host's location on first visit to this step, instead of
  // silently defaulting to Delhi and making them find the pin and their
  // actual address manually. Only runs once, and only when no location has
  // been set yet (so it never overrides an address the host already picked).
  useEffect(() => {
    if (draft.latitude || draft.longitude || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        const result = await reverseGeocode(lat, lng);
        handleLocationSelect(lat, lng, result?.displayName ?? '');
      },
      () => {
        // Permission denied or unavailable - keep the Delhi default and let
        // the host search/pick manually instead of interrupting them.
      },
      { timeout: 10000 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    update({ addressLine1: newAddress });
  };

  const handleLocationSelect = (lat: number, lng: number, addr: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(addr);
    setDisplayAddress(addr);
    update({
      latitude: lat,
      longitude: lng,
      addressLine1: addr,
      // Clear any locationId resolved for a previous pin immediately -- a
      // stale locationId from an earlier address is worse than none, since
      // it silently mislabels the listing under the wrong destination.
      locationId: undefined,
    });

    // Resolve which curated location this pin falls under, so the listing
    // isn't left with no location_id (see resolveLocationId above).
    reverseGeocode(lat, lng).then((result) => {
      if (!result) return;
      resolveLocationId(result.address.city, result.address.county).then((locationId) => {
        if (locationId) update({ locationId });
      });
    });
  };

  return (
    <WizardShell
      step={2}
      title="Where is your property located?"
      subtitle="Your address is only shared with guests after they've made a reservation."
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left: search + pin details */}
        <div className="md:col-span-4 flex flex-col gap-4 order-2 md:order-1">
          <AddressSearch
            value={address}
            onChange={handleAddressChange}
            onSelect={handleLocationSelect}
          />

          {/* Selected location preview */}
          {displayAddress && (
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-figma-navy flex items-center justify-center shrink-0">
                  <Pin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-figma-navy">Pin picked</h3>
                  <p className="text-sm font-medium text-gray-800 line-clamp-2">
                    {displayAddress}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Privacy note */}
          <div className="flex gap-3 p-4 bg-white rounded-2xl border border-dashed border-gray-300">
            <ShieldCheck className="w-5 h-5 text-gray-400 shrink-0" />
            <p className="text-xs text-gray-500 leading-relaxed">
              We only use your address to show an approximate location to guests.
              Your exact address is shared only after a booking is confirmed.
            </p>
          </div>
        </div>

        {/* Right: map */}
        <div className="md:col-span-8 order-1 md:order-2">
          <MapPicker
            latitude={latitude}
            longitude={longitude}
            onLocationChange={handleLocationSelect}
            displayAddress={displayAddress}
          />
        </div>
      </div>
    </WizardShell>
  );
}
