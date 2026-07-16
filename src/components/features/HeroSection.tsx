import SearchForm from "@/components/features/SearchForm";

import { cn } from "@/lib/utils";
import { useListingState, useListingActions } from "@/context/ListingFilterContext";
import type { SearchFilters } from "@/types";

const heroBg = "/hero-bg.jpg";

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
    <section className="bg-gray-50/50 pb-8 lg:pb-12 pt-5 lg:pt-8 flex items-center mt-3">
      <div className="container-main">
        {/* Main white wrapper matching the screenshot's unified container */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-2 sm:p-3 lg:p-4">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-center">

            {/* Left: hero image card */}
            <div
              className="relative w-full lg:w-[480px] xl:w-[500px] flex-shrink-0 rounded-[2rem] overflow-hidden select-none"
              style={{ minHeight: 400 }}
            >
              <img src={heroBg} alt="Lush green forest" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
              <div className="relative z-10 p-7 sm:p-9 flex flex-col h-full" style={{ minHeight: 400 }}>
                <p className="text-white/90 text-sm font-medium tracking-wide mb-1">Discover your next</p>
                <h1 className="text-white font-extrabold leading-[1.1] mb-auto" style={{ fontSize: "clamp(2.8rem,5vw,3.8rem)" }}>
                  Perfect stay
                </h1>

                {/* Popular Choices Glass Panel */}
                <div className="mt-auto pt-6">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-lg">
                    <h3 className="text-center text-white/90 font-medium tracking-[0.15em] uppercase text-xs mb-5">
                      Popular Choices
                    </h3>
                    <div className="flex flex-wrap justify-center gap-2.5">
                      {HERO_TAGS.map(({ id, label }) => {
                        const checked = isChecked(id);
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => toggleTag(id)}
                            className="flex items-center gap-2 bg-white hover:bg-white/90 text-gray-700 text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer transition-colors shadow-sm"
                          >
                            <div className={cn(
                              "w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors",
                              checked ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 bg-white"
                            )}>
                              {checked && <svg className="w-2.5 h-2.5" viewBox="0 0 14 14" fill="none"><path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                            </div>
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
            <div className="flex-1 flex flex-col justify-center py-6 lg:py-0 w-full lg:max-w-md pr-0 lg:pr-8 mx-auto">
              <SearchForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
