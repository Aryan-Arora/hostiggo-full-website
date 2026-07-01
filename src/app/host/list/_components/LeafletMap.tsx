'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LeafletMapProps {
  latitude: number;
  longitude: number;
  onMarkerMove?: (lat: number, lng: number) => void;
}

export default function LeafletMap({ latitude, longitude, onMarkerMove }: LeafletMapProps) {
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

    // Fix marker icon issue in Next.js
    const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png';
    const shadowUrl =
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png';

    const markerIcon = L.icon({
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    // Create draggable marker
    const marker = L.marker([latitude, longitude], {
      icon: markerIcon,
      draggable: true,
    }).addTo(map);

    // Handle marker drag
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onMarkerMove?.(pos.lat, pos.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    // Expose map instance for zoom controls
    (window as any).__mapInstance = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

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
