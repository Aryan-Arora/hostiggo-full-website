'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Search, X } from 'lucide-react';
import FiltersSidebar from '@/components/features/FiltersSidebar';

const MapPicker = dynamic(
  () => import('@/app/host/list/_components/MapPicker'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[400px] bg-gray-100 rounded-2xl flex items-center justify-center animate-pulse">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-[#003B5C] rounded-full animate-spin" />
          <span className="text-xs font-medium">Loading map...</span>
        </div>
      </div>
    ),
  },
);

export interface MapSearchLayoutProps {
  onClose?: () => void;
  onSearch?: (query: string) => void;
  onLocationChange?: (lat: number, lng: number, address: string) => void;
  latitude?: number;
  longitude?: number;
  initialSearchQuery?: string;
  className?: string;
}

export default function MapSearchLayout({
  onClose,
  onSearch,
  onLocationChange,
  latitude,
  longitude,
  initialSearchQuery = '',
  className = '',
}: MapSearchLayoutProps) {
  const [isFilterHidden, setIsFilterHidden] = useState(false);
  const [activeTab, setActiveTab] = useState<'filter' | 'homestays'>('filter');
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

  const handleToggleFilter = () => {
    setIsFilterHidden((prev) => !prev);
    setActiveTab('filter');
  };

  const handleShowHomestays = () => {
    setActiveTab('homestays');
  };

  return (
    <div
      className={`h-screen bg-[#FAFAF8] p-4 flex flex-col gap-4 overflow-hidden ${className}`}
    >
      {/* Top Action Bar (Header) */}
      <header className="flex items-center justify-between shrink-0 gap-4">
        {/* Left: Toggle Group */}
        <div className="flex items-center bg-white border border-gray-200 rounded-full p-1 shadow-sm">
          <button
            type="button"
            onClick={handleToggleFilter}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer ${
              activeTab === 'filter' && !isFilterHidden
                ? 'bg-[#003B5C] text-white shadow-sm'
                : 'bg-transparent text-gray-700 hover:bg-gray-100'
            }`}
          >
            {isFilterHidden ? 'Show filter' : 'Hide filter'}
          </button>
          <button
            type="button"
            onClick={handleShowHomestays}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer ${
              activeTab === 'homestays'
                ? 'bg-[#003B5C] text-white shadow-sm'
                : 'bg-transparent text-gray-700 hover:bg-gray-100'
            }`}
          >
            Show homestays
          </button>
        </div>

        {/* Center: Search Bar */}
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

        {/* Right: Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="bg-white border border-gray-200 rounded-full px-4 py-2.5 flex items-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm transition-all duration-200 cursor-pointer shrink-0"
        >
          <span>Close map</span>
          <X className="w-4 h-4 text-gray-500 shrink-0" />
        </button>
      </header>

      {/* Two-Column Split Layout (Body) */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Left Column (Sidebar) */}
        {!isFilterHidden && (
          <aside className="w-[320px] shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden transition-all duration-300">
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
              <FiltersSidebar />
            </div>
          </aside>
        )}

        {/* Right Column (Map Area) */}
        <main className="flex-1 bg-gray-100 rounded-2xl overflow-hidden relative shadow-sm border border-gray-200">
          <div className="w-full h-full [&>div]:!h-full [&>div]:!w-full [&>div]:!rounded-none [&>div]:!border-0 [&>div]:!shadow-none">
            <MapPicker
              latitude={latitude}
              longitude={longitude}
              onLocationChange={onLocationChange}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
