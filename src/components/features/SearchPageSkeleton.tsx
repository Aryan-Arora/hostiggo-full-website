'use client';

import Navbar from '@/components/layout/Navbar';
import PropertyCardSkeleton from '@/components/features/PropertyCardSkeleton';
import { LoadingState } from '@/components/features/LoadingStates';

export default function SearchPageSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-[#FFFEF9]">
      <Navbar />

      {/* Search bar strip */}
      <div className="bg-[#004772] flex-shrink-0 py-3.5 px-4 sm:px-6 lg:px-8 shadow-md z-40">
        <div className="max-w-7xl mx-auto">
          <div className="h-12 bg-white/20 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
          <div className="flex gap-6 items-start">
            {/* Sidebar skeleton */}
            <div className="hidden lg:block w-[240px] flex-shrink-0 space-y-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse w-24" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                  <div className="h-6 bg-gray-100 rounded w-full animate-pulse" />
                </div>
              ))}
            </div>

            {/* Main content area */}
            <div className="flex-1 min-w-0">
              {/* Results header skeleton */}
              <div className="mb-6 space-y-3">
                <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
                <div className="h-6 bg-gray-100 rounded w-96 animate-pulse" />
              </div>

              {/* Property cards */}
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <PropertyCardSkeleton key={i} variant="modern" />
                ))}
              </div>

              {/* Loading indicator */}
              <div className="mt-12 py-8 flex justify-center">
                <LoadingState
                  state="loading"
                  message="Fetching properties from Supabase..."
                  variant="dots"
                  size="lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
