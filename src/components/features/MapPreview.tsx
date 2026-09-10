'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { loadGoogleMaps, onGoogleMapsAuthFailure } from '@/lib/services/googleMaps';

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'New Delhi': { lat: 28.6139, lng: 77.209 },
  Manali: { lat: 32.2396, lng: 77.1887 },
  Shimla: { lat: 31.1048, lng: 77.1734 },
  Jaipur: { lat: 26.9124, lng: 75.7873 },
  Bangalore: { lat: 12.9716, lng: 77.5946 },
  Rishikesh: { lat: 30.0869, lng: 78.2676 },
  Goa: { lat: 15.2993, lng: 74.124 },
  Dharamshala: { lat: 32.219, lng: 76.3234 },
  Kasol: { lat: 32.0109, lng: 77.313 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
};

const INDIA_CENTER = { lat: 22.5937, lng: 78.9629 };

const PIN_PATH =
  'M12 2C7.58 2 4 5.58 4 10c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z';

interface MapPreviewProps {
  city?: string;
  count?: number;
  coordinates?: { lat: number; lng: number };
}

export default function MapPreview({
  city = 'New Delhi',
  count = 0,
  coordinates,
}: MapPreviewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapUnavailable, setMapUnavailable] = useState(false);

  const getCenter = () => {
    if (coordinates) return { lat: coordinates.lat, lng: coordinates.lng };

    for (const [name, coords] of Object.entries(CITY_COORDINATES)) {
      if (city.toLowerCase().includes(name.toLowerCase())) return coords;
    }
    return INDIA_CENTER;
  };

  // See InteractiveMap's identical hook for why this is needed: a bad or
  // restricted API key reports through this global callback, not by
  // rejecting loadGoogleMaps() or throwing synchronously.
  useEffect(() => onGoogleMapsAuthFailure(() => setMapUnavailable(true)), []);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapRef.current || mapInstanceRef.current) return;

        const center = getCenter();

        // Previously unguarded -- a bad key made this throw and left
        // mapLoaded stuck at false forever, so every one of these previews
        // spun its loading indicator indefinitely instead of ever showing
        // an end state.
        try {
          const map = new google.maps.Map(mapRef.current, {
            center,
            zoom: 11,
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
              fillColor: '#ef4444',
              fillOpacity: 1,
              strokeWeight: 0,
              scale: 1.6,
              anchor: new google.maps.Point(12, 22),
            },
          });

          mapInstanceRef.current = map;
          setMapLoaded(true);
        } catch (err) {
          console.error('[MapPreview] Failed to initialize Google Maps:', err);
          setMapUnavailable(true);
        }
      })
      .catch((err) => {
        console.error('[MapPreview] Failed to load Google Maps:', err);
        setMapUnavailable(true);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update map center when city or coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;
    const center = getCenter();
    mapInstanceRef.current.setCenter(center);
    if (markerRef.current) {
      markerRef.current.setPosition(center);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, coordinates, mapLoaded]);

  return (
    <div
      className="rounded-2xl overflow-hidden border border-gray-100 relative"
      style={{ height: 160 }}
    >
      <div ref={mapRef} className="w-full h-full" />

      {!mapLoaded && !mapUnavailable && (
        <div className="absolute inset-0 bg-figma-navy/5 flex items-center justify-center">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-figma-navy/40 border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
            <p className="text-[11px] text-figma-navy font-medium">Loading…</p>
          </div>
        </div>
      )}

      {mapUnavailable && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
          <div className="text-center px-4">
            <MapPin className="w-5 h-5 text-gray-300 mx-auto mb-1" />
            <p className="text-[11px] text-gray-500 font-medium">Map preview unavailable</p>
          </div>
        </div>
      )}

      {/* Overlay label */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-white/90 to-transparent py-2 px-3 pointer-events-none">
        <p className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-figma-navy" />
          {city} · {count} properties
        </p>
      </div>
    </div>
  );
}
