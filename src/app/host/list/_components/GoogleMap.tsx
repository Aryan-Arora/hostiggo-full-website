'use client';

import { useEffect, useRef } from 'react';
import { loadGoogleMaps } from '@/lib/services/googleMaps';

const PIN_PATH =
  'M12 2C7.58 2 4 5.58 4 10c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z';

interface GoogleMapProps {
  latitude: number;
  longitude: number;
  onMarkerMove?: (lat: number, lng: number) => void;
  onMapClick?: (lat: number, lng: number) => void;
  allowClickToPlace?: boolean;
}

export default function GoogleMap({
  latitude,
  longitude,
  onMarkerMove,
  onMapClick,
  allowClickToPlace = false,
}: GoogleMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current || mapRef.current) return;

        // scrollwheel is off by default so the page can scroll normally over
        // the map instead of the map hijacking the wheel and zooming/panning
        // while the host is trying to scroll the page; it's enabled only
        // while the map itself has focus (click/tap on it).
        const map = new google.maps.Map(containerRef.current, {
          center: { lat: latitude, lng: longitude },
          zoom: 13,
          scrollwheel: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
        map.addListener('click', () => map.setOptions({ scrollwheel: true }));
        containerRef.current.addEventListener('mouseleave', () =>
          map.setOptions({ scrollwheel: false }),
        );

        const marker = new google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map,
          draggable: true,
          icon: {
            path: PIN_PATH,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeWeight: 0,
            scale: 1.6,
            anchor: new google.maps.Point(12, 22),
          },
        });

        marker.addListener('dragend', () => {
          const pos = marker.getPosition();
          if (!pos) return;
          onMarkerMove?.(pos.lat(), pos.lng());
        });

        if (allowClickToPlace) {
          map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (!e.latLng) return;
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            marker.setPosition({ lat, lng });
            onMapClick?.(lat, lng);
            onMarkerMove?.(lat, lng);
          });
        }

        mapRef.current = map;
        markerRef.current = marker;

        // Expose map instance for zoom controls
        (window as any).__mapInstance = map;
      })
      .catch((err) => {
        console.error('[GoogleMap] Failed to load Google Maps:', err);
      });

    return () => {
      cancelled = true;
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowClickToPlace]);

  // Update marker position when lat/lng change externally
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setPosition({ lat: latitude, lng: longitude });
      if (mapRef.current) {
        mapRef.current.panTo({ lat: latitude, lng: longitude });
      }
    }
  }, [latitude, longitude]);

  return <div ref={containerRef} style={{ width: '100%', height: '480px' }} />;
}
