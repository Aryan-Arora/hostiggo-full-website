'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Search, X, Briefcase, Plus, Minus } from 'lucide-react';
import PropertyCardList from '@/components/features/PropertyCardList';
import type { Property } from '@/types';

// Dynamically import MapPicker with SSR disabled to avoid hydration/Google Maps SSR issues
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

// Comprehensive mock property dataset matching the Property type
const DEFAULT_MOCK_PROPERTIES: Property[] = [
  {
    id: 'mock-prop-1',
    propertyName: 'The Heritage Haveli & Spa',
    city: 'Jaipur',
    state: 'Rajasthan',
    price: 4500,
    originalPrice: 6000,
    rating: 4.85,
    reviewCount: 128,
    amenities: ['Wifi', 'Breakfast', 'Parking', 'Pool'],
    propertyType: 'Heritage Villa',
    images: [
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop&q=80',
    ],
    maxGuests: 4,
    freeCancellation: true,
    breakfast: true,
    wifi: true,
    parking: true,
    distanceFromCenter: '1.2 km',
  },
  {
    id: 'mock-prop-2',
    propertyName: 'Tranquil Pine Forest Chalet',
    city: 'Manali',
    state: 'Himachal Pradesh',
    price: 3800,
    originalPrice: 4800,
    rating: 4.92,
    reviewCount: 94,
    amenities: ['Wifi', 'Breakfast', 'Mountain View', 'Heating'],
    propertyType: 'Wooden Chalet',
    images: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=80',
    ],
    maxGuests: 3,
    freeCancellation: true,
    breakfast: true,
    wifi: true,
    parking: false,
    distanceFromCenter: '2.5 km',
  },
  {
    id: 'mock-prop-3',
    propertyName: 'Azure Palms Beachfront Villa',
    city: 'Goa',
    state: 'Goa',
    price: 6200,
    originalPrice: 7500,
    rating: 4.78,
    reviewCount: 215,
    amenities: ['Wifi', 'Parking', 'Pool', 'AC'],
    propertyType: 'Beach Villa',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80',
    ],
    maxGuests: 6,
    freeCancellation: false,
    breakfast: false,
    wifi: true,
    parking: true,
    distanceFromCenter: '0.8 km',
  },
  {
    id: 'mock-prop-4',
    propertyName: 'Cloud Nine Hilltop Homestay',
    city: 'Munnar',
    state: 'Kerala',
    price: 5100,
    originalPrice: 6500,
    rating: 4.95,
    reviewCount: 88,
    amenities: ['Wifi', 'Breakfast', 'Balcony', 'Kitchen'],
    propertyType: 'Estate Homestay',
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
    ],
    maxGuests: 4,
    freeCancellation: true,
    breakfast: true,
    wifi: true,
    parking: true,
    distanceFromCenter: '3.1 km',
  },
  {
    id: 'mock-prop-5',
    propertyName: 'Emerald Valley Colonial Bungalow',
    city: 'Ooty',
    state: 'Tamil Nadu',
    price: 4200,
    originalPrice: 5200,
    rating: 4.68,
    reviewCount: 76,
    amenities: ['Wifi', 'Breakfast', 'Parking'],
    propertyType: 'Colonial Bungalow',
    images: [
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&auto=format&fit=crop&q=80',
    ],
    maxGuests: 2,
    freeCancellation: true,
    breakfast: true,
    wifi: true,
    parking: true,
    distanceFromCenter: '1.8 km',
  },
];

// Mock map pins with prices and coordinate percentages
const MOCK_PRICE_PINS = [
  { id: 'pin-1', price: '₹ 4,500', top: '22%', left: '26%' },
  { id: 'pin-2', price: '₹ 6,200', top: '38%', right: '22%' },
  { id: 'pin-3', price: '₹ 3,800', bottom: '30%', left: '34%' },
  { id: 'pin-4', price: '₹ 5,100', top: '56%', left: '16%' },
  { id: 'pin-5', price: '₹ 4,200', bottom: '40%', right: '18%' },
  { id: 'pin-6', price: '₹ 7,500', top: '68%', right: '32%' },
];

export interface HomestaysMapLayoutProps {
  properties?: Property[];
  onClose?: () => void;
  onSearch?: (query: string) => void;
  onLocationChange?: (lat: number, lng: number, address: string) => void;
  latitude?: number;
  longitude?: number;
  initialSearchQuery?: string;
  className?: string;
}

export default function HomestaysMapLayout({
  properties = DEFAULT_MOCK_PROPERTIES,
  onClose,
  onSearch,
  onLocationChange,
  latitude,
  longitude,
  initialSearchQuery = '',
  className = '',
}: HomestaysMapLayoutProps) {
  const [showHomestays, setShowHomestays] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

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
      {/* 3. Top Action Bar (Header) */}
      <header className="flex items-center justify-between shrink-0 gap-4">
        {/* Left (Toggle Group) */}
        <div className="flex items-center bg-white border border-gray-200 rounded-full p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setShowFilter((prev) => !prev)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer ${
              showFilter
                ? 'bg-[#003B5C] text-white shadow-sm'
                : 'bg-transparent text-gray-700 hover:bg-gray-100'
            }`}
          >
            Show filter
          </button>
          <button
            type="button"
            onClick={() => setShowHomestays((prev) => !prev)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer ${
              showHomestays
                ? 'bg-[#003B5C] text-white shadow-sm'
                : 'bg-transparent text-gray-700 hover:bg-gray-100'
            }`}
          >
            {showHomestays ? 'Hide homestays' : 'Show homestays'}
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

      {/* 4. Two-Column Split Layout (Body) */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left Column (Property List) */}
        {showHomestays && (
          <aside className="w-[500px] shrink-0 flex flex-col gap-6 overflow-y-auto pb-20 scrollbar-hide">
            {properties.map((property) => (
              <PropertyCardList key={property.id} property={property} />
            ))}
          </aside>
        )}

        {/* Right Column (Map Area) */}
        <main className="flex-1 bg-gray-100 rounded-[35px] overflow-hidden relative shadow-sm border border-gray-200">
          <div className="w-full h-full [&>div]:!h-full [&>div]:!w-full [&>div]:!rounded-none [&>div]:!border-0 [&>div]:!shadow-none">
            <MapPicker
              latitude={latitude}
              longitude={longitude}
              onLocationChange={onLocationChange}
            />
          </div>

          {/* 5. Map Overlays (Visual Mocks) */}

          {/* Main Location Marker (Top Center) */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-auto group cursor-pointer">
            <div className="w-11 h-11 bg-[#003B5C] rounded-full flex items-center justify-center text-white shadow-xl ring-4 ring-white/90 group-hover:scale-110 transition-transform duration-200">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="mt-1.5 bg-white/95 backdrop-blur-sm px-3 py-0.5 rounded-full text-[11px] font-bold text-[#003B5C] shadow-md border border-gray-100 tracking-wide">
              Central Location
            </span>
          </div>

          {/* Floating Price Pills (Map Pins) */}
          {MOCK_PRICE_PINS.map((pin) => (
            <div
              key={pin.id}
              style={{
                top: pin.top,
                bottom: pin.bottom,
                left: pin.left,
                right: pin.right,
              }}
              className="absolute z-10 pointer-events-auto cursor-pointer select-none group"
            >
              <div className="bg-white rounded-full px-3 py-1 text-[13px] font-bold text-[#003B5C] shadow-md border border-gray-100 hover:bg-[#003B5C] hover:text-white hover:scale-105 transition-all duration-150">
                {pin.price}
              </div>
            </div>
          ))}

          {/* Floating + and - Zoom Controls (Bottom Right) */}
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
    </div>
  );
}
