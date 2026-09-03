'use client';

import { cn } from '@/lib/utils';
import { CATEGORIES } from '@/lib/amenityCatalog';

// Presentational amenity picker grid. Shared by the listing wizard's
// amenities step, the AI-import review screen, and the Edit Listing
// dashboard. Selection state (a Set of amenityCatalog string ids) is owned
// by the parent.
export default function AmenityGrid({
  selected,
  onToggle,
}: {
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-8">
      {CATEGORIES.map((cat) => {
        const CatIcon = cat.icon;
        return (
          <section key={cat.title}>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <CatIcon className="w-5 h-5 text-figma-navy" />
              {cat.title}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {cat.items.map((item) => {
                const Icon = item.icon;
                const active = selected.has(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggle(item.id)}
                    className={cn(
                      'flex flex-col items-center justify-center p-6 bg-white border rounded-xl h-full text-center transition-all hover:-translate-y-0.5',
                      active
                        ? 'border-figma-navy ring-1 ring-figma-navy bg-figma-navy/4'
                        : 'border-gray-200 hover:border-gray-300',
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-7 h-7 mb-3',
                        active ? 'text-figma-navy' : 'text-gray-500',
                      )}
                    />
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
