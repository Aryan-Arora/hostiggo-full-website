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

    // Initialize map. scrollWheelZoom is off by default so the page can
    // scroll normally over the map instead of the map hijacking the wheel
    // and zooming/panning while the host is trying to scroll the page;
    // it's enabled only while the map itself has focus (click/tap on it).
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(
      [latitude, longitude],
      13,
    );
    map.on('click', () => map.scrollWheelZoom.enable());
    containerRef.current.addEventListener('mouseleave', () => map.scrollWheelZoom.disable());

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

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

    // Create marker with custom red pin icon
    const marker = L.marker([latitude, longitude], {
      icon: customIcon,
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
