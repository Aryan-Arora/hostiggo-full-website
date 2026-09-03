'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { loadGoogleMaps, onGoogleMapsAuthFailure } from '@/lib/services/googleMaps';

const PIN_PATH =
  'M12 2C7.58 2 4 5.58 4 10c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z';

interface ListingLocationMapProps {
  latitude?: number | null;
  longitude?: number | null;
  /** Tailwind height class for the map box. */
  heightClass?: string;
}

/**
 * Static, non-interactive preview of a single listing's location. Not a
 * picker -- the host edits the location via the address field next to it.
 * Mirrors MapPreview's key-failure handling: a bad/restricted/unbilled API
 * key reports only via the global `gm_authFailure` hook, not by rejecting
 * loadGoogleMaps() or throwing synchronously.
 */
export default function ListingLocationMap({
  latitude,
  longitude,
  heightClass = 'h-64',
}: ListingLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapUnavailable, setMapUnavailable] = useState(false);

  const hasCoords =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  useEffect(() => onGoogleMapsAuthFailure(() => setMapUnavailable(true)), []);

  useEffect(() => {
    if (!hasCoords || !mapRef.current || mapInstanceRef.current) return;
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapRef.current || mapInstanceRef.current) return;
        const center = { lat: latitude as number, lng: longitude as number };
        try {
          const map = new google.maps.Map(mapRef.current, {
            center,
            zoom: 14,
            disableDefaultUI: true,
            draggable: false,
            scrollwheel: false,
            keyboardShortcuts: false,
          });
          markerRef.current = new google.maps.Marker({
            position: center,
            map,
            icon: {
              path: PIN_PATH,
              fillColor: '#004772',
              fillOpacity: 1,
              strokeWeight: 0,
              scale: 1.8,
              anchor: new google.maps.Point(12, 22),
            },
          });
          mapInstanceRef.current = map;
          setMapLoaded(true);
        } catch (err) {
          console.error('[ListingLocationMap] init failed:', err);
          setMapUnavailable(true);
        }
      })
      .catch((err) => {
        console.error('[ListingLocationMap] load failed:', err);
        setMapUnavailable(true);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCoords]);

  // Recenter when the coordinates change (e.g. host picks a new address).
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || !hasCoords) return;
    const center = { lat: latitude as number, lng: longitude as number };
    mapInstanceRef.current.setCenter(center);
    markerRef.current?.setPosition(center);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, mapLoaded]);

  if (!hasCoords) {
    return (
      <div
        className={`${heightClass} w-full rounded-2xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center`}
      >
        <div className="text-center px-4">
          <MapPin className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
          <p className="text-sm text-gray-500 font-medium">No location set yet</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Pick an address and the map will pin it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${heightClass} w-full rounded-2xl overflow-hidden border border-gray-200 relative bg-gray-100`}>
      <div ref={mapRef} className="w-full h-full" />

      {!mapLoaded && !mapUnavailable && (
        <div className="absolute inset-0 bg-figma-navy/5 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-figma-navy/40 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {mapUnavailable && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
          <div className="text-center px-4">
            <MapPin className="w-5 h-5 text-gray-300 mx-auto mb-1" />
            <p className="text-xs text-gray-500 font-medium">Map preview unavailable</p>
          </div>
        </div>
      )}
    </div>
  );
}
