'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Search, X, Plus, Minus } from 'lucide-react';
import PropertyCardList from '@/components/features/PropertyCardList';
import type { Property } from '@/types';

// Import the map component dynamically to avoid SSR issues
const MapPicker = dynamic(
  () => import('@/app/host/list/_components/MapPicker'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[400px] bg-gray-100 rounded-[35px] flex items-center justify-center animate-pulse">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-[#003B5C] rounded-full animate-spin" />
          <span className="text-xs font-medium">Loading map...</span>
        </div>
      </div>
    ),
  },
);

// High-fidelity mock property matching the active pin price of ₹26,700
const DEFAULT_MOCK_PROPERTY: Property = {
  id: 'mock-fullmap-prop',
  propertyName: 'The Royal Lakeview Palace & Spa',
  city: 'Udaipur',
  state: 'Rajasthan',
  price: 26700,
  originalPrice: 32000,
  rating: 4.96,
  reviewCount: 184,
  amenities: ['Wifi', 'Breakfast', 'Parking', 'Pool'],
  propertyType: 'Luxury Heritage Villa',
  images: [
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop&q=80',
  ],
  maxGuests: 4,
  freeCancellation: true,
  breakfast: true,
  wifi: true,
  parking: true,
  distanceFromCenter: '0.8 km',
};

// Inactive price pins distributed across the map
const INACTIVE_PRICE_PINS = [
  { id: 'pin-1', price: '₹2,300', top: '18%', left: '22%' },
  { id: 'pin-2', price: '₹4,500', top: '25%', right: '28%' },
  { id: 'pin-3', price: '₹1,850', top: '48%', left: '16%' },
  { id: 'pin-4', price: '₹3,200', top: '32%', left: '38%' },
  { id: 'pin-5', price: '₹5,600', bottom: '38%', right: '18%' },
  { id: 'pin-6', price: '₹2,900', top: '55%', right: '32%' },
];

export interface FullMapSearchLayoutProps {
  property?: Property;
  onClose?: () => void;
  onSearch?: (query: string) => void;
  onLocationChange?: (lat: number, lng: number, address: string) => void;
  latitude?: number;
  longitude?: number;
  initialSearchQuery?: string;
  className?: string;
}

export default function FullMapSearchLayout({
  property = DEFAULT_MOCK_PROPERTY,
  onClose,
  onSearch,
  onLocationChange,
  latitude,
  longitude,
  initialSearchQuery = '',
  className = '',
}: FullMapSearchLayoutProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [isCardVisible, setIsCardVisible] = useState(true);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    onSearch?.(val);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch?.(searchQuery);
    }
  };

  const handleZoomIn = () => {
    const map = (window as any).__mapInstance;
    if (map && typeof map.getZoom === 'function' && typeof map.setZoom === 'function') {
      map.setZoom(map.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    const map = (window as any).__mapInstance;
    if (map && typeof map.getZoom === 'function' && typeof map.setZoom === 'function') {
      map.setZoom(map.getZoom() - 1);
    }
  };

  return (
    <div
      className={`h-screen bg-[#FAFAF8] p-4 flex flex-col gap-4 overflow-hidden ${className}`}
    >
      {/* 2. Main Wrapper & Header */}
      <header className="flex items-center justify-between shrink-0 gap-4">
        {/* Left (Toggle Group) */}
        <div className="flex gap-2">
          <button
            type="button"
            className="bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Hide filter
          </button>
          <button
            type="button"
            className="bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Show homestays
          </button>
        </div>

        {/* Center (Search Bar) */}
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-full px-4 py-2.5 flex items-center gap-2 shadow-sm focus-within:ring-2 focus-within:ring-[#003B5C]/15 focus-within:border-[#003B5C]/40 transition-all">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search on map"
            className="w-full bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                onSearch?.('');
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-full"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right (Close Button) */}
        <button
          type="button"
          onClick={onClose}
          className="bg-white border border-gray-200 rounded-full px-4 py-2.5 flex items-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm transition-all duration-200 cursor-pointer shrink-0"
        >
          <span>Close map</span>
          <X className="w-4 h-4 text-gray-500 shrink-0" />
        </button>
      </header>

      {/* 3. Main Map Area (Body) */}
      <main className="flex-1 bg-gray-100 rounded-[35px] overflow-hidden relative shadow-sm border border-gray-200">
        <div className="w-full h-full [&>div]:!h-full [&>div]:!w-full [&>div]:!rounded-none [&>div]:!border-0 [&>div]:!shadow-none">
          <MapPicker
            latitude={latitude}
            longitude={longitude}
            onLocationChange={onLocationChange}
          />
        </div>

        {/* 4. Map Overlays & Floating Elements */}

        {/* Inactive Price Pins */}
        {INACTIVE_PRICE_PINS.map((pin) => (
          <div
            key={pin.id}
            style={{
              top: pin.top,
              bottom: pin.bottom,
              left: pin.left,
              right: pin.right,
            }}
            className="absolute bg-white rounded-full px-3 py-1 text-[13px] font-bold text-[#003B5C] shadow-md border border-gray-100 hover:scale-105 hover:bg-gray-50 transition-all duration-150 z-10 cursor-pointer select-none"
          >
            {pin.price}
          </div>
        ))}

        {/* Active Price Pin */}
        <div
          style={{ top: '24%', left: '50%', transform: 'translateX(-50%)' }}
          className="absolute bg-[#003B5C] rounded-full px-3 py-1 text-[13px] font-bold text-white shadow-lg ring-2 ring-white/80 hover:scale-105 transition-all duration-150 z-20 cursor-pointer select-none"
        >
          ₹26,700
        </div>

        {/* Floating Property Card (Crucial) */}
        {isCardVisible && (
          <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 z-10 w-[92%] sm:w-[85%] md:w-[750px] max-w-[855px]">
            <div className="relative">
              {/* Render property card */}
              <PropertyCardList property={property} />

              {/* Circular Close Button (X icon) positioned at top-right corner overlapping slightly */}
              <button
                type="button"
                onClick={() => setIsCardVisible(false)}
                className="absolute -top-3 -right-3 bg-white rounded-full p-1.5 shadow-md border border-gray-100 cursor-pointer hover:bg-gray-50 z-20 transition-transform active:scale-95 text-gray-600 hover:text-gray-900"
                aria-label="Close property card"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Map Controls: Floating + and - zoom controls at the bottom center/right of the map wrapper */}
        <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-[#003B5C] active:scale-95 transition-all cursor-pointer"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-[#003B5C] active:scale-95 transition-all cursor-pointer"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <Minus className="w-5 h-5" />
          </button>
        </div>
      </main>
    </div>
  );
}
