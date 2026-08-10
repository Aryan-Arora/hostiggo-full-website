'use client';

import { Check } from "lucide-react";
import Image from "next/image";
import SearchForm from "@/components/features/SearchForm";

import { cn } from "@/lib/utils";
import { useListingState, useListingActions } from "@/context/ListingFilterContext";
import type { SearchFilters } from "@/types";

const heroBg = "/hero-bg.jpg?v=4";

const HERO_TAGS = [
  { id: "budget", label: "₹1000 - ₹ 3000" },
  { id: "breakfast", label: "Free breakfast" },
  { id: "cancellation", label: "Free cancellation" },
  { id: "family", label: "Family comfort" },
  { id: "5star", label: "5 ★" },
  { id: "above3", label: "Above 3 ★" },
  { id: "lowest", label: "Lowest price" },
] as const;

export default function HeroSection() {
  const { filters, sort } = useListingState();
  const { setPriceRange, setRating, setBooleanFilter, setSort } = useListingActions();

  const isChecked = (id: string): boolean => {
    switch (id) {
      case "budget":
        return filters.priceMin === 1000 && filters.priceMax === 3000;
      case "breakfast":
        return filters.breakfast;
      case "cancellation":
        return filters.freeCancellation;
      case "family":
        return filters.familyFriendly;
      case "5star":
        return filters.guestRating === 5;
      case "above3":
        return filters.guestRating === 3;
      case "lowest":
        return sort === "price_asc";
      default:
        return false;
    }
  };

  const toggleTag = (id: string) => {
    const active = isChecked(id);
    switch (id) {
      case "budget":
        setPriceRange(active ? [0, 100000] : [1000, 3000]);
        break;
      case "breakfast":
        setBooleanFilter("breakfast" as keyof SearchFilters, !active);
        break;
      case "cancellation":
        setBooleanFilter("freeCancellation" as keyof SearchFilters, !active);
        break;
      case "family":
        setBooleanFilter("familyFriendly" as keyof SearchFilters, !active);
        break;
      case "5star":
        setRating(active ? null : 5);
        break;
      case "above3":
        setRating(active ? null : 3);
        break;
      case "lowest":
        setSort(active ? "recommended" : "price_asc");
        break;
    }
  };

  return (
    <section className="pb-8 lg:pb-12 pt-4 flex items-center">
      <div className="container-main w-full min-w-0">
        {/* Outer White Card Container matching Figma screenshot */}
        <div className="bg-white rounded-[36px] sm:rounded-[44px] p-5 sm:p-7 border border-gray-100 shadow-[0_12px_48px_rgba(0,0,0,0.05)] flex flex-col lg:flex-row gap-8 lg:gap-10 items-center">

          {/* Left: hero image card */}
          <div
            className="relative w-full lg:w-[480px] xl:w-[510px] flex-shrink-0 rounded-[28px] sm:rounded-[36px] overflow-hidden select-none"
            style={{ minHeight: 460 }}
          >
            <Image
              src={heroBg}
              alt="Aerial view of a beach"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 510px"
              className="object-cover"
              quality={95}
            />
            {/* Subtle dark gradient overlay for black-toned image feel */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-black/50" />

            <div className="relative z-10 p-6 sm:p-8 flex flex-col h-full" style={{ minHeight: 480 }}>
              {/* Text styling matching Figma Dev Mode exactly */}
              <p className="text-white mb-0" style={{ fontSize: '32px', fontWeight: 400, lineHeight: '140%', letterSpacing: '0.003em' }}>
                Discover your next
              </p>
              <h1 className="text-white mb-auto" style={{ fontSize: '55px', fontWeight: 600, lineHeight: '140%', letterSpacing: '0.003em' }}>
                Perfect stay
              </h1>

              {/* Popular Choices Glass Panel */}
              <div className="mt-auto pt-4">
                <div
                  className="backdrop-blur-[2px] rounded-[24px] p-4 sm:p-5"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
                  }}
                >
                  <h3 className="text-center text-white mb-3.5" style={{ fontSize: '22px', fontWeight: 500, lineHeight: '140%', letterSpacing: '0.17em' }}>
                    Popular Choices
                  </h3>

                  {/* Rectangular option boxes with square checkboxes */}
                  <div className="flex flex-wrap justify-center gap-2">
                    {HERO_TAGS.map(({ id, label }) => {
                      const checked = isChecked(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => toggleTag(id)}
                          aria-pressed={checked}
                          className="flex items-center gap-2 text-type-poppins-regular-15-128-03 text-[#1B1B1B] px-3.5 py-2 rounded-xl bg-white hover:bg-white transition-all cursor-pointer shadow-sm border border-gray-100/80"
                        >
                          <span
                            className={cn(
                              "w-4 h-4 rounded-[4px] flex items-center justify-center transition-colors flex-shrink-0",
                              checked
                                ? "bg-figma-navy text-white border border-figma-navy"
                                : "bg-white border border-gray-300"
                            )}
                          >
                            {checked && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: search panel */}
          <div className="flex-1 flex flex-col justify-center py-2 lg:py-0 w-full lg:max-w-md mx-auto">
            <SearchForm />
          </div>
        </div>
      </div>
    </section>
  );
}
