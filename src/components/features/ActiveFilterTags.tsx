import { X, Star } from "lucide-react";
import type { SearchFilters } from "@/types";
import { cn } from "@/lib/utils";

interface ActiveFilterTagsProps {
  filters: SearchFilters;
  onRemove: (key: keyof SearchFilters, value?: string) => void;
  onClearAll: () => void;
}

export default function ActiveFilterTags({ filters, onRemove, onClearAll }: ActiveFilterTagsProps) {
  const tags: { label: string; onRemove: () => void }[] = [];

  if (filters.priceMin > 0 || filters.priceMax < 100000) {
    tags.push({
      label: `₹${filters.priceMin.toLocaleString("en-IN")} – ₹${filters.priceMax.toLocaleString("en-IN")}`,
      onRemove: () => { onRemove("priceMin"); onRemove("priceMax"); },
    });
  }
  if (filters.guestRating) {
    tags.push({ label: `Rating ${filters.guestRating}+`, onRemove: () => onRemove("guestRating") });
  }
  if (filters.freeCancellation) {
    tags.push({ label: "Free cancellation", onRemove: () => onRemove("freeCancellation") });
  }
  if (filters.breakfast) {
    tags.push({ label: "Breakfast available", onRemove: () => onRemove("breakfast") });
  }
  if (filters.parking) {
    tags.push({ label: "Parking", onRemove: () => onRemove("parking") });
  }
  if (filters.wifi) {
    tags.push({ label: "WiFi", onRemove: () => onRemove("wifi") });
  }
  if (filters.ac) {
    tags.push({ label: "AC", onRemove: () => onRemove("ac") });
  }
  filters.propertyTypes.forEach(pt => {
    tags.push({
      label: pt,
      onRemove: () => onRemove("propertyTypes", pt),
    });
  });
  filters.amenities.forEach(am => {
    tags.push({
      label: am,
      onRemove: () => onRemove("amenities", am),
    });
  });
  filters.stayTypes.forEach(st => {
    tags.push({
      label: st === "Entire Property" ? "Entire place" : st === "Shared Space" ? "Shared room" : st,
      onRemove: () => onRemove("stayTypes", st),
    });
  });

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2.5 mt-2 sm:mt-0">
      {tags.map((tag, i) => (
        <span
          key={i}
          className="flex items-center gap-2 bg-[#f4faff] border border-[#a2cbfe] text-[#0081ff] text-[13px] font-medium px-4 py-2 rounded-full"
        >
          {tag.label === "Rating 4+" && <><span className="font-medium">4</span><Star className="w-3.5 h-3.5 fill-[#facc15] text-[#facc15] mx-[-2px]" /></>}
          {tag.label !== "Rating 4+" && tag.label}
          <button
            onClick={tag.onRemove}
            className="flex items-center justify-center hover:opacity-75 transition-opacity ml-1"
          >
            <X className="w-4 h-4 text-[#0081ff]" strokeWidth={2.5} />
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="text-[12px] font-semibold text-gray-400 hover:text-red-500 transition-colors underline underline-offset-2 ml-1"
      >
        Clear all
      </button>
    </div>
  );
}
