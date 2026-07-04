'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

// Lazy load Leaflet
const LeafletModule = typeof window !== 'undefined' ? require('leaflet') : null;

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
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const getCenter = () => {
    if (coordinates) return { lat: coordinates.lat, lng: coordinates.lng };

    for (const [name, coords] of Object.entries(CITY_COORDINATES)) {
      if (city.toLowerCase().includes(name.toLowerCase())) return coords;
    }
    return INDIA_CENTER;
  };

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const L = LeafletModule;
    if (!L) return;

    // Load CSS on client
    if (typeof document !== 'undefined' && !document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const center = getCenter();

    mapInstanceRef.current = L.map(mapRef.current).setView(
      [center.lat, center.lng],
      11,
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    // Add marker
    markerRef.current = L.marker([center.lat, center.lng]).addTo(mapInstanceRef.current);

    // Disable interactions
    if (mapInstanceRef.current) {
      mapInstanceRef.current.dragging.disable();
      mapInstanceRef.current.scrollWheelZoom.disable();
    }

    setMapLoaded(true);
  }, []);

  // Update map center when city or coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;
    const center = getCenter();
    mapInstanceRef.current.setView([center.lat, center.lng], 11);
    if (markerRef.current) {
      markerRef.current.setLatLng([center.lat, center.lng]);
    }
  }, [city, coordinates, mapLoaded]);

  return (
    <div
      className="rounded-2xl overflow-hidden border border-gray-100 relative"
      style={{ height: 160 }}
    >
      <div ref={mapRef} className="w-full h-full" />

      {!mapLoaded && (
        <div className="absolute inset-0 bg-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
            <p className="text-[11px] text-blue-500 font-medium">Loading…</p>
          </div>
        </div>
      )}

      {/* Overlay label */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-white/90 to-transparent py-2 px-3 pointer-events-none">
        <p className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-blue-500" />
          {city} · {count} properties
        </p>
      </div>
    </div>
  );
}
