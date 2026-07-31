import Link from "next/link";

export default function CTABanner() {
  return (
    <section className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] px-8 md:px-12 py-8 md:py-10">
      <h2 className="text-center text-gray-900 text-xl md:text-[22px] font-bold mb-8">
        Want to earn effortlessly?
      </h2>

      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-6">
        {/* Left: copy + CTA */}
        <div className="flex-1 max-w-xs">
          <p className="text-gray-800 text-[14px] leading-relaxed mb-5">
            List your Homestay on Hostiggo and start receiving bookings from
            travellers.
          </p>
          <p className="text-gray-800 text-[14px] font-medium mb-6">
            Earn extra income NOW!!!
          </p>
          <Link
            href="/host/list/property-type"
            className="inline-flex items-center bg-[#0473C8] hover:bg-[#035ea5] active:bg-[#024b85] text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-sm"
          >
            Get started
          </Link>
        </div>

        {/* Middle: celebration illustration */}
        <div className="flex-shrink-0 hidden sm:block">
          <img
            src="/host-celebration.png"
            alt="Happy host celebrating"
            className="w-[140px] h-auto select-none"
          />
        </div>

        {/* Right: Royal Deal card */}
        <div
          className="relative flex-shrink-0 w-full md:w-[360px] rounded-2xl overflow-hidden p-6 bg-[#0b2c47]"
          style={{
            backgroundImage: "url(/royal-deal-bg.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="w-9 h-9 bg-[#0f4c81] border border-white/30 rounded-full flex items-center justify-center mb-3">
            <span className="text-white font-bold text-[16px] leading-none">H</span>
          </div>
          <p className="text-white text-[13px] leading-relaxed">
            First 10 bookings are 0% commission for all new hosts
          </p>
          <p className="text-white/90 text-[13px] leading-relaxed mt-2">
            After that, only 2% platform commission applies (lowest to all
            other platforms)
          </p>
          <p className="text-amber-400 text-[17px] font-bold mt-4">Royal Deal</p>
        </div>
      </div>
    </section>
  );
}
