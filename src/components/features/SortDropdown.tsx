import { useState, useRef, useCallback, useEffect } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import type { SortOption } from "@/types";
import { cn } from "@/lib/utils";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "price_asc", label: "Price: Low to high" },
  { value: "price_desc", label: "Price: High to low" },
  { value: "top_rated", label: "Top rated" },
  { value: "most_popular", label: "Most reviewed" },
  { value: "newest", label: "Newest listings" },
  { value: "distance", label: "Distance from center" },
  { value: "best_value", label: "Best value" },
];

interface SortDropdownProps {
  value: SortOption;
  onChange: (v: SortOption) => void;
}

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = SORT_OPTIONS.find(o => o.value === value);

  const handleSelect = useCallback((v: SortOption) => { onChange(v); setOpen(false); }, [onChange]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full border text-[13px] font-medium transition-all",
          open
            ? "border-gray-800 bg-white text-gray-900 shadow-sm"
            : "border-gray-800 bg-white text-gray-800 hover:bg-gray-50"
        )}
      >
        <SlidersHorizontal className="w-4 h-4 text-gray-700" strokeWidth={2} />
        <span>Sort By : {current?.label ?? "Recommended"}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="dropdown-panel animate-fade-in-down absolute top-full left-0 mt-1 w-52 py-1 z-50">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "w-full text-left px-4 py-2.5 text-[12px] transition-colors",
                value === opt.value
                  ? "text-figma-navy font-semibold bg-figma-navy/50"
                  : "text-gray-600 font-medium hover:bg-gray-50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
