'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LeafletMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  height?: string | number;
  markers?: Array<{
    lat: number;
    lng: number;
    label?: string;
    popup?: string;
    icon?: 'default' | 'blue' | 'red' | 'green';
  }>;
  onMapClick?: (lat: number, lng: number) => void;
  draggableMarker?: boolean;
  onMarkerDrag?: (lat: number, lng: number) => void;
  className?: string;
}

export default function LeafletMap({
  center,
  zoom = 13,
  height = 400,
  markers = [],
  onMapClick,
  draggableMarker = false,
  onMarkerDrag,
  className = '',
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const draggableMarkerRef = useRef<L.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current).setView(
      [center.lat, center.lng],
      zoom,
    );

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    // Add click handler if callback provided
    if (onMapClick) {
      mapInstanceRef.current.on('click', (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    setMapLoaded(true);

    return () => {
      // Don't destroy map on unmount to preserve state
    };
  }, []);

  // Update center when prop changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([center.lat, center.lng], zoom);
  }, [center, zoom]);

  // Create custom marker icon
  const createMarkerIcon = (color: string) => {
    return L.divIcon({
      html: `<div style="
        background-color: ${color};
        width: 32px;
        height: 40px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      "></div>`,
      iconSize: [32, 40],
      iconAnchor: [16, 40],
      popupAnchor: [0, -40],
      className: 'custom-marker',
    });
  };

  const getMarkerColor = (iconType?: string): string => {
    switch (iconType) {
      case 'blue':
        return '#004772';
      case 'red':
        return '#ef4444';
      case 'green':
        return '#10b981';
      default:
        return '#004772';
    }
  };

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    // Remove old markers not in the new list
    markersRef.current.forEach((marker, key) => {
      if (!markers.find((m) => `${m.lat}-${m.lng}` === key)) {
        marker.remove();
        markersRef.current.delete(key);
      }
    });

    // Add or update markers
    markers.forEach((markerData) => {
      const key = `${markerData.lat}-${markerData.lng}`;
      const color = getMarkerColor(markerData.icon);

      if (!markersRef.current.has(key)) {
        const marker = L.marker([markerData.lat, markerData.lng], {
          icon: createMarkerIcon(color),
        }).addTo(mapInstanceRef.current!);

        if (markerData.popup) {
          marker.bindPopup(markerData.popup);
        }

        if (markerData.label) {
          marker.bindTooltip(markerData.label, {
            permanent: true,
            direction: 'top',
            offset: [0, -10],
          });
        }

        markersRef.current.set(key, marker);
      }
    });
  }, [markers, mapLoaded]);

  // Add draggable marker if enabled
  useEffect(() => {
    if (!mapInstanceRef.current || !draggableMarker || !mapLoaded) return;

    if (!draggableMarkerRef.current) {
      draggableMarkerRef.current = L.marker(
        [center.lat, center.lng],
        {
          draggable: true,
          icon: createMarkerIcon('#004772'),
        },
      ).addTo(mapInstanceRef.current);

      draggableMarkerRef.current.on('dragend', () => {
        const newPos = draggableMarkerRef.current!.getLatLng();
        onMarkerDrag?.(newPos.lat, newPos.lng);
      });
    } else {
      draggableMarkerRef.current.setLatLng([center.lat, center.lng]);
    }
  }, [center, draggableMarker, mapLoaded, onMarkerDrag]);

  const heightValue = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      ref={mapRef}
      className={`rounded-lg border border-gray-200 ${className}`}
      style={{ height: heightValue, width: '100%' }}
    />
  );
}
