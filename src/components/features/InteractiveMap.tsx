'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { StarIcon, X, CheckCircle, Navigation } from 'lucide-react';
import type { Property } from '@/types';

// Lazy load Leaflet on client side only
const LeafletModule = typeof window !== 'undefined' ? require('leaflet') : null;

const INDIA_CENTER = { lat: 22.5937, lng: 78.9629 };

interface InteractiveMapProps {
  properties: Property[];
  activeId?: string | null;
  onMarkerClick?: (id: string) => void;
  className?: string;
  pointer?: { lat: number; lng: number } | null;
  onPointerMoved?: (lat: number, lng: number) => void;
  reverseGeocodeEnabled?: boolean;
}

export default function InteractiveMap({
  properties,
  activeId,
  onMarkerClick,
  className = '',
  pointer,
  onPointerMoved,
  reverseGeocodeEnabled = false,
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const pointerMarkerRef = useRef<L.Marker | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const router = useRouter();

  const syncMapToPointer = useCallback(
    (lat: number, lng: number) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      const L = LeafletModule;
      if (!L) return;

      map.panTo([lat, lng]);
      map.setZoom(13);

      // Remove old pointer marker
      if (pointerMarkerRef.current) {
        pointerMarkerRef.current.remove();
      }

      // Create new pointer marker (blue circle with white dot)
      const pointerIcon = L.divIcon({
        html: `<div style="
          width: 32px;
          height: 32px;
          background-color: #2563eb;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: 'pointer-marker',
      });

      const marker = L.marker([lat, lng], { icon: pointerIcon, draggable: true }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onPointerMoved?.(pos.lat, pos.lng);
      });

      pointerMarkerRef.current = marker;
    },
    [onPointerMoved],
  );

  // Initialize Leaflet map
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

    // Fix marker icon issue in Next.js by using mergeOptions
    // This ensures the default icon is properly configured if needed
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    mapInstanceRef.current = L.map(mapRef.current).setView(
      [INDIA_CENTER.lat, INDIA_CENTER.lng],
      5,
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    setMapLoaded(true);
  }, []);

  const getCenter = () => {
    const withCoords = properties.filter((p) => p.coordinates);
    if (withCoords.length === 0) return INDIA_CENTER;

    const lat =
      withCoords.reduce((sum, p) => sum + p.coordinates!.lat, 0) /
      withCoords.length;
    const lng =
      withCoords.reduce((sum, p) => sum + p.coordinates!.lng, 0) /
      withCoords.length;

    return { lat, lng };
  };

  const getZoom = (): number => {
    const cities = new Set(properties.map((p) => p.city));
    if (cities.size === 1) return 13;
    if (cities.size <= 3) return 10;
    return 5;
  };

  const createMarkerIcon = (property: Property, isActive: boolean) => {
    const L = LeafletModule;
    if (!L) return null;

    const price = `₹${Math.round(property.price / 1000)}k`;
    const bgColor = isActive ? '#1d4ed8' : '#2563eb';
    const borderColor = isActive ? 'white' : 'rgba(255,255,255,0.6)';
    const borderWidth = isActive ? 2.5 : 2;

    return L.divIcon({
      html: `<div style="
        background-color: ${bgColor};
        border: ${borderWidth}px solid ${borderColor};
        border-radius: 50%;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        font-weight: 700;
        font-size: 12px;
        color: white;
        cursor: pointer;
        font-family: system-ui, -apple-system;
      ">${price}</div>`,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
      popupAnchor: [0, -24],
      className: 'property-marker',
    });
  };

  const addMarkers = () => {
    if (!mapInstanceRef.current) return;

    const L = LeafletModule;
    if (!L) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      marker.remove();
    });
    markersRef.current.clear();

    const bounds = L.latLngBounds([]);
    let hasCoords = false;

    properties.forEach((property) => {
      if (!property.coordinates) return;
      hasCoords = true;

      const { lat, lng } = property.coordinates;
      bounds.extend([lat, lng]);

      const isActive = property.id === activeId;
      const icon = createMarkerIcon(property, isActive);
      if (!icon) return;

      const marker = L.marker([lat, lng], { icon, title: property.propertyName }).addTo(
        mapInstanceRef.current!,
      );

      marker.on('click', () => {
        setSelectedProperty(property);
        onMarkerClick?.(property.id);
      });

      markersRef.current.set(property.id, marker);
    });

    // Fit bounds if multiple properties
    if (hasCoords && properties.filter((p) => p.coordinates).length > 1) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    } else if (hasCoords) {
      const center = getCenter();
      mapInstanceRef.current.setView([center.lat, center.lng], getZoom());
    }
  };

  // Re-add markers when properties change
  useEffect(() => {
    if (!mapLoaded) return;
    addMarkers();
  }, [properties, mapLoaded]);

  // Update marker icons when active changes
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const property = properties.find((p) => p.id === id);
      if (property) {
        const isActive = id === activeId;
        const icon = createMarkerIcon(property, isActive);
        marker.setIcon(icon);
      }
    });
  }, [activeId, properties]);

  // Sync external pointer marker
  useEffect(() => {
    if (!mapLoaded) return;
    if (pointer) {
      syncMapToPointer(pointer.lat, pointer.lng);
    } else if (pointerMarkerRef.current) {
      pointerMarkerRef.current.remove();
      pointerMarkerRef.current = null;
    }
  }, [pointer, mapLoaded, syncMapToPointer]);

  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
      <div ref={mapRef} className="w-full h-full rounded-2xl overflow-hidden" style={{ minHeight: 400 }} />

      {/* Loading overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-blue-50 rounded-2xl flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-blue-600">Loading map…</p>
          </div>
        </div>
      )}

      {/* Property popup card */}
      {selectedProperty && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[300px] bg-white rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
        >
          {/* Image */}
          <div className="relative h-36">
            <img
              src={selectedProperty.images[0]}
              alt={selectedProperty.propertyName}
              className="w-full h-full object-cover"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedProperty(null);
              }}
              className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
            >
              <X className="w-3.5 h-3.5 text-gray-600" />
            </button>
            {selectedProperty.originalPrice && (
              <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                -
                {Math.round(
                  ((selectedProperty.originalPrice - selectedProperty.price) /
                    selectedProperty.originalPrice) *
                    100,
                )}
                % OFF
              </div>
            )}
          </div>
          {/* Info */}
          <div className="p-3">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                  {selectedProperty.propertyType}
                </span>
                <h4 className="text-[13px] font-bold text-gray-800 leading-snug mt-0.5 line-clamp-1">
                  {selectedProperty.propertyName}
                </h4>
                <p className="text-[11px] text-gray-400">
                  {selectedProperty.city}, {selectedProperty.state}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                {selectedProperty.originalPrice && (
                  <p className="text-[10px] text-gray-400 line-through">
                    ₹{selectedProperty.originalPrice.toLocaleString('en-IN')}
                  </p>
                )}
                <p className="text-[16px] font-extrabold text-blue-700 leading-none">
                  ₹{selectedProperty.price.toLocaleString('en-IN')}
                </p>
                <p className="text-[9px] text-gray-400 font-medium">
                  per night
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2.5">
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-lg px-1.5 py-0.5">
                <StarIcon className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span className="text-[11px] font-bold text-amber-700">
                  {selectedProperty.rating > 0 ? selectedProperty.rating.toFixed(1) : 'New'}
                </span>
              </div>
              <span className="text-[11px] text-gray-400">
                {selectedProperty.reviewCount} reviews
              </span>
              {selectedProperty.freeCancellation && (
                <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5">
                  <CheckCircle className="w-2.5 h-2.5" /> Free cancel
                </span>
              )}
            </div>

            {/* Amenities */}
            <div className="flex gap-1.5 flex-wrap mb-3">
              {selectedProperty.amenities.slice(0, 3).map((am) => (
                <span
                  key={am}
                  className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-full"
                >
                  {am}
                </span>
              ))}
            </div>

            <button
              onClick={() => router.push(`/property/${selectedProperty.id}`)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-[12px] font-semibold transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      )}

      {/* Property count badge */}
      {mapLoaded && (
        <div
          className="absolute top-3 left-3 z-[999] bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 text-[12px] font-semibold text-gray-700"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
        >
          {properties.filter((p) => p.coordinates).length} properties on map
        </div>
      )}

      {/* Current location button */}
      {mapLoaded && (
        <button
          onClick={() => {
            if (!navigator.geolocation) return;
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                syncMapToPointer(lat, lng);
                onPointerMoved?.(lat, lng);
              },
              (err) => {
                console.warn('[InteractiveMap] Geolocation error:', err.message);
              },
              { enableHighAccuracy: true, timeout: 10000 },
            );
          }}
          className="absolute top-3 right-3 z-[999] bg-white/95 backdrop-blur-sm rounded-full px-3 py-2 text-[12px] font-semibold text-gray-700 hover:bg-white hover:shadow-md transition-all flex items-center gap-1.5"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
          title="Use current location"
        >
          <Navigation className="w-3.5 h-3.5 text-blue-600" />
          Current location
        </button>
      )}
    </div>
  );
}
