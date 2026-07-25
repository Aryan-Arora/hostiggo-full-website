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
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-[19px] font-bold text-figma-ink capitalize">
          {title}
        </h2>
        <button
          onClick={() =>
            router.push(`/search?destination=${encodeURIComponent(city)}`)
          }
          className="text-[12px] text-figma-navy bg-figma-navy/10 hover:bg-figma-navy/15 px-3 py-1 rounded-full transition-colors font-semibold"
        >
          View all
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: itemsPerRow }).map((_, i) => (
              <PropertyCardHomeSkeleton key={`skeleton-${i}`} />
            ))
          : properties.map((p) => <PropertyCard key={p.id} property={p} />)}
      </div>
    </section>
  );
}
