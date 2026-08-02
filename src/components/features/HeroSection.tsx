import SearchForm from "@/components/features/SearchForm";

const heroBg = "/hero-bg.jpg";

const HERO_TAGS = [
  { id: "budget", label: "₹1000 - ₹ 3000" },
  { id: "breakfast", label: "Free breakfast" },
  { id: "cancellation", label: "Free cancellation", checked: true },
  { id: "family", label: "Family comfort" },
  { id: "5star", label: "5 ★" },
  { id: "above3", label: "Above 3 ★" },
  { id: "lowest", label: "Lowest price" },
];

export default function HeroSection() {
  return (
    <section className="pb-8 lg:pb-12 pt-5 lg:pt-8 flex items-center mt-3">
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
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-center text-white/90 font-medium tracking-[0.3em] uppercase text-xs mb-5">
                      Popular Choices
                    </h3>
                    <div className="flex flex-wrap justify-center gap-2.5">
                      {HERO_TAGS.map(({ id, label }) => (
                        <span
                          key={id}
                          className="bg-white text-gray-700 text-xs font-semibold px-4 py-2 rounded-full shadow-sm"
                        >
                          {label}
                        </span>
                      ))}
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
