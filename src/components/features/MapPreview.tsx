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

    // Create custom red pin marker using divIcon (reliable approach)
    const customIcon = L.divIcon({
      html: `
        <div style="
          width: 32px;
          height: 40px;
          background-image: url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%23ef4444%22><path d=%22M12 2C7.58 2 4 5.58 4 10c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z%22/></svg>');
          background-repeat: no-repeat;
          background-position: center;
          background-size: contain;
          cursor: pointer;
        "></div>
      `,
      iconSize: [32, 40],
      iconAnchor: [16, 40],
      popupAnchor: [0, -40],
      className: 'custom-marker-pin',
    });

    // Add marker with custom red pin icon
    markerRef.current = L.marker([center.lat, center.lng], {
      icon: customIcon,
    }).addTo(mapInstanceRef.current);

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
        <div className="absolute inset-0 bg-figma-navy/5 flex items-center justify-center">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-figma-navy/40 border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
            <p className="text-[11px] text-figma-navy font-medium">Loading…</p>
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
