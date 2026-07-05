'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LeafletMapProps {
  latitude: number;
  longitude: number;
  onMarkerMove?: (lat: number, lng: number) => void;
  onMapClick?: (lat: number, lng: number) => void;
  allowClickToPlace?: boolean;
}

export default function LeafletMap({ 
  latitude, 
  longitude, 
  onMarkerMove,
  onMapClick,
  allowClickToPlace = false,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(containerRef.current).setView([latitude, longitude], 13);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Fix marker icon issue in Next.js by using mergeOptions
    // This ensures icons are loaded from the correct CDN URL
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    // Create marker with default icon (now properly configured)
    const marker = L.marker([latitude, longitude], {
      draggable: true,
    }).addTo(map);

    // Handle marker drag
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onMarkerMove?.(pos.lat, pos.lng);
    });

    // Handle map clicks to place new pins if enabled
    if (allowClickToPlace) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        onMapClick?.(lat, lng);
        onMarkerMove?.(lat, lng);
      });
    }

    mapRef.current = map;
    markerRef.current = marker;

    // Expose map instance for zoom controls
    (window as any).__mapInstance = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [allowClickToPlace]);

  // Update marker position when lat/lng change externally
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
      if (mapRef.current) {
        mapRef.current.panTo([latitude, longitude]);
      }
    }
  }, [latitude, longitude]);

  return <div ref={containerRef} style={{ width: '100%', height: '480px' }} />;
}
