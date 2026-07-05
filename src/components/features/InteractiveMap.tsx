import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StarIcon, X, CheckCircle } from 'lucide-react';
import type { Property } from '@/types';
import { INDIA_CENTER } from '@/lib/googleMapsUtils';

interface InteractiveMapProps {
  properties: Property[];
  activeId?: string | null;
  onMarkerClick?: (id: string) => void;
  className?: string;
}

export default function InteractiveMap({
  properties,
  activeId,
  onMarkerClick,
  className = '',
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<
    Map<
      string,
      { marker: google.maps.Marker; infoWindow: google.maps.InfoWindow }
    >
  >(new Map());
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const [mapLoaded, setMapLoaded] = useState(false);
  const router = useRouter();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  // Initialize Google Map
  useEffect(() => {
    if (!mapRef.current || googleMapRef.current || !apiKey) return;

    const loadGoogleMaps = () => {
      if ((window as any).google?.maps) {
        initMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, [apiKey]);

  const initMap = () => {
    if (!mapRef.current) return;

    const center = getCenter();
    const zoom = getZoom();

    googleMapRef.current = new (window as any).google.maps.Map(mapRef.current, {
      center: { lat: center.lat, lng: center.lng },
      zoom: zoom,
      styles: [
        {
          featureType: 'poi',
          stylers: [{ visibility: 'off' }],
        },
      ],
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
    });

    setMapLoaded(true);
    addMarkers();
  };

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
    const price = `₹${Math.round(property.price / 1000)}k`;
    const bgColor = isActive ? '#1d4ed8' : '#2563eb';
    const borderColor = isActive ? 'white' : 'rgba(255,255,255,0.6)';
    const borderWidth = isActive ? 2.5 : 2;

    const svg = `
      <svg width="80" height="48" viewBox="0 0 80 48" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow${property.id}" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="${isActive ? '0.4' : '0.25'}" />
          </filter>
        </defs>
        <rect x="4" y="4" width="72" height="32" rx="16" fill="${bgColor}" filter="url(#shadow${property.id})" stroke="${borderColor}" stroke-width="${borderWidth}"/>
        <text x="40" y="24" text-anchor="middle" dominant-baseline="middle" font-size="12" font-weight="700" fill="white" font-family="system-ui, -apple-system">${price}</text>
        <polygon points="40,36 36,44 44,44" fill="${bgColor}"/>
      </svg>
    `;

    const icon: google.maps.Icon = {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      size: new (window as any).google.maps.Size(80, 48),
      origin: new (window as any).google.maps.Point(0, 0),
      anchor: new (window as any).google.maps.Point(40, 48),
      scaledSize: new (window as any).google.maps.Size(80, 48),
    };

    return icon;
  };

  const addMarkers = () => {
    if (!googleMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(({ marker, infoWindow }) => {
      marker.setMap(null);
      infoWindow.close();
    });
    markersRef.current.clear();

    const google = (window as any).google;
    const bounds = new google.maps.LatLngBounds();

    properties.forEach((property) => {
      if (!property.coordinates) return;

      const { lat, lng } = property.coordinates;
      bounds.extend({ lat, lng });

      const isActive = property.id === activeId;
      const icon = createMarkerIcon(property, isActive);

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: googleMapRef.current,
        icon: icon,
        title: property.propertyName,
        zIndex: isActive ? 1000 : 1,
      });

      const infoWindow = new google.maps.InfoWindow();

      marker.addListener('click', () => {
        setSelectedProperty(property);
        if (onMarkerClick) onMarkerClick(property.id);
      });

      markersRef.current.set(property.id, { marker, infoWindow });
    });

    // Fit bounds if multiple properties
    if (properties.filter((p) => p.coordinates).length > 1) {
      const padding = { top: 50, right: 50, bottom: 50, left: 50 };
      googleMapRef.current.fitBounds(bounds, padding);
    }
  };

  // Re-add markers when properties change
  useEffect(() => {
    if (!mapLoaded || !googleMapRef.current) return;
    addMarkers();
  }, [properties, mapLoaded]);

  // Highlight active marker
  useEffect(() => {
    if (!mapLoaded || !googleMapRef.current) return;

    markersRef.current.forEach(({ marker }, id) => {
      const property = properties.find((p) => p.id === id);
      if (property) {
        const isActive = id === activeId;
        const icon = createMarkerIcon(property, isActive);
        marker.setIcon(icon);
        marker.setZIndex(isActive ? 1000 : 1);
      }
    });
  }, [activeId, mapLoaded, properties]);

  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
      <div
        ref={mapRef}
        className="w-full h-full rounded-2xl overflow-hidden"
        style={{ minHeight: 400 }}
      />

      {/* Loading / unavailable overlay */}
      {!apiKey ? (
        <div className="absolute inset-0 bg-blue-50 rounded-2xl flex items-center justify-center">
          <div className="text-center px-6">
            <p className="text-sm font-semibold text-gray-700">Map unavailable</p>
            <p className="text-xs text-gray-500 mt-1 max-w-[220px]">
              The map can&apos;t load right now. Browse the list of stays instead.
            </p>
          </div>
        </div>
      ) : (
        !mapLoaded && (
          <div className="absolute inset-0 bg-blue-50 rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <div
                className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"
                style={{ borderWidth: 3 }}
              />
              <p className="text-sm font-semibold text-blue-600">Loading map…</p>
            </div>
          </div>
        )
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
    </div>
  );
}
