'use client';

import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PropertyCard from '@/components/features/PropertyCard';
import PropertyCardHomeSkeleton from '@/components/features/PropertyCardHomeSkeleton';
import type { Property } from '@/types';

interface PopularStaysProps {
  title: string;
  properties: Property[];
  isLoading?: boolean;
  itemsPerRow?: number;
}

export default function PopularStays({
  title,
  properties,
  isLoading = false,
  itemsPerRow = 4,
}: PopularStaysProps) {
  const router = useRouter();
  const city = properties[0]?.city ?? '';

  return (
    <section>
      <div className="flex items-center gap-4 mb-5">
        <h2 className="text-[22px] font-semibold text-figma-ink">
          {title}
        </h2>
        <button
          onClick={() =>
            router.push(`/search?destination=${encodeURIComponent(city)}`)
          }
          className="text-[12px] text-figma-navy bg-white shadow-md hover:shadow-lg px-3.5 py-1 rounded-full transition-all font-semibold"
        >
          View all
        </button>
      </div>
      <div className="relative">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: itemsPerRow }).map((_, i) => (
                <PropertyCardHomeSkeleton key={`skeleton-${i}`} />
              ))
            : properties.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
        {!isLoading && properties.length > 0 && (
          <button
            onClick={() =>
              router.push(`/search?destination=${encodeURIComponent(city)}`)
            }
            aria-label="View all stays"
            className="absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg hover:shadow-xl flex items-center justify-center text-figma-ink hover:text-figma-navy transition-all group z-10"
          >
            <ArrowRight className="w-[18px] h-[18px] group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
    </section>
  );
}
