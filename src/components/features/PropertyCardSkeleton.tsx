'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface PropertyCardSkeletonProps {
  variant?: 'modern' | 'classic';
}

export default function PropertyCardSkeleton({
  variant = 'modern',
}: PropertyCardSkeletonProps) {
  if (variant === 'classic') {
    return (
      <div className="bg-white rounded-[2rem] p-3 flex flex-col sm:flex-row gap-4 sm:gap-6 border border-gray-100">
        {/* Image Skeleton */}
        <div className="flex-shrink-0 w-full sm:w-[280px] h-[200px] sm:h-[220px] rounded-[1.5rem] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:1000px_100%] animate-shimmer" />

        {/* Content Skeleton */}
        <div className="flex-1 flex flex-col justify-between py-1 pr-2 min-w-0 gap-4">
          {/* Header Row */}
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0 flex-1 space-y-3">
              {/* Title */}
              <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:1000px_100%] rounded w-3/4 animate-shimmer" />
              {/* Location */}
              <div className="h-4 bg-gradient-to-r from-gray-150 via-gray-100 to-gray-150 bg-[length:1000px_100%] rounded w-1/2 animate-shimmer" />
              {/* Rating */}
              <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:1000px_100%] rounded-md w-32 mt-2 animate-shimmer" />
            </div>

            {/* Pricing Column */}
            <div className="flex-shrink-0 flex flex-col items-end gap-2">
              <div className="h-3 bg-gradient-to-r from-gray-150 via-gray-100 to-gray-150 bg-[length:1000px_100%] rounded w-32 animate-shimmer" />
              <div className="h-7 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:1000px_100%] rounded w-24 animate-shimmer" />
              <div className="h-3 bg-gradient-to-r from-gray-150 via-gray-100 to-gray-150 bg-[length:1000px_100%] rounded w-20 animate-shimmer" />
            </div>
          </div>

          {/* Tags */}
          <div className="flex gap-2">
            <div className="h-6 bg-gradient-to-r from-gray-150 via-gray-100 to-gray-150 bg-[length:1000px_100%] rounded w-28 animate-shimmer" />
            <div className="h-6 bg-gradient-to-r from-gray-150 via-gray-100 to-gray-150 bg-[length:1000px_100%] rounded w-24 animate-shimmer" />
          </div>

          {/* Room Details */}
          <div className="h-4 bg-gradient-to-r from-gray-150 via-gray-100 to-gray-150 bg-[length:1000px_100%] rounded w-40 animate-shimmer" />
        </div>
      </div>
    );
  }

  // Modern variant with better visual hierarchy
  return (
    <div className="bg-white rounded-[2rem] p-3 flex flex-col sm:flex-row gap-4 sm:gap-6 border border-gray-100 overflow-hidden">
      {/* Image Section with Shimmer */}
      <div className="flex-shrink-0 w-full sm:w-[280px] h-[200px] sm:h-[220px] rounded-[1.5rem] overflow-hidden">
        <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:1000px_100%] animate-shimmer" />
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col justify-between py-1 pr-2 min-w-0">
        {/* Top Section */}
        <div className="space-y-4">
          {/* Title & Location */}
          <div className="space-y-2">
            <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:1000px_100%] rounded w-3/4 animate-shimmer" />
            <div className="h-4 bg-gradient-to-r from-gray-150 via-gray-100 to-gray-150 bg-[length:1000px_100%] rounded w-full max-w-md animate-shimmer" />
          </div>

          {/* Rating Badge */}
          <div className="flex gap-3">
            <div className="h-7 w-12 bg-gradient-to-r from-emerald-200 via-emerald-100 to-emerald-200 bg-[length:1000px_100%] rounded animate-shimmer flex-shrink-0" />
            <div className="h-4 w-24 bg-gradient-to-r from-gray-150 via-gray-100 to-gray-150 bg-[length:1000px_100%] rounded animate-shimmer" />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            <div className="h-6 w-32 bg-gradient-to-r from-figma-navy/10 via-figma-navy/5 to-figma-navy/10 bg-[length:1000px_100%] rounded animate-shimmer" />
            <div className="h-6 w-28 bg-gradient-to-r from-gray-150 via-gray-100 to-gray-150 bg-[length:1000px_100%] rounded animate-shimmer" />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <div className="h-4 w-40 bg-gradient-to-r from-gray-150 via-gray-100 to-gray-150 bg-[length:1000px_100%] rounded animate-shimmer" />
            <div className="h-4 w-32 bg-gradient-to-r from-gray-150 via-gray-100 to-gray-150 bg-[length:1000px_100%] rounded animate-shimmer" />
          </div>
        </div>

        {/* Price Section - Right Aligned */}
        <div className="flex justify-end pt-4">
          <div className="text-right space-y-1">
            <div className="h-3 w-24 bg-gradient-to-r from-gray-150 via-gray-100 to-gray-150 bg-[length:1000px_100%] rounded animate-shimmer ml-auto" />
            <div className="h-8 w-28 bg-gradient-to-r from-figma-navy/20 via-figma-navy/10 to-figma-navy/20 bg-[length:1000px_100%] rounded animate-shimmer ml-auto" />
            <div className="h-3 w-32 bg-gradient-to-r from-gray-150 via-gray-100 to-gray-150 bg-[length:1000px_100%] rounded animate-shimmer ml-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
