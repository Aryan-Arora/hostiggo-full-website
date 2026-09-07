import Image from "next/image";
import Link from "next/link";

export default function CTABanner() {
  return (
    <section className="bg-[#FFFEF9] rounded-[32px] border border-gray-200 p-8 md:p-12">
      {/* ── Top-Centered Header ── */}
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-10">
        Want to earn effortlessly?
      </h2>

      {/* ── Three-Column Grid Layout (Body) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        {/* ── Left Column (Text & Button) ── */}
        <div className="flex flex-col items-start space-y-4">
          <p className="text-gray-700 text-base md:text-lg leading-relaxed">
            List your Homestay on Hostiggo and start receiving bookings from travellers.
          </p>
          <p className="text-gray-900 font-bold text-base md:text-lg">
            Earn extra income NOW!!!
          </p>
          <Link
            href="/host/list/method"
            className="inline-block bg-[#0396EF] text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-blue-600 transition-colors"
          >
            Get started
          </Link>
        </div>

        {/* ── Middle Column (Graphic) ── */}
        <div className="flex justify-center items-center">
          <Image
            src="/host-celebration.png"
            alt="Earn effortlessly with Hostiggo"
            width={192}
            height={288}
            className="w-48 h-auto object-contain mx-auto"
            priority
          />
        </div>

        {/* ── Right Column ("Royal Deal" Card) ── */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
          {/* Card Header */}
          <div className="bg-white text-gray-900 w-8 h-8 rounded-full flex items-center justify-center font-bold mb-4 text-sm shadow-sm">
            H
          </div>

          {/* Card Body */}
          <p className="text-sm font-semibold text-white/95 leading-snug">
            First 10 bookings are 0% commission for all new hosts
          </p>

          <div className="border-t border-dashed border-gray-600 my-4" />

          <p className="text-xs text-gray-300 leading-relaxed">
            After that, only 2% platform commission applies (lowest to all other platforms)
          </p>

          {/* Card Footer */}
          <p className="text-yellow-500 font-bold text-lg mt-4">
            Royal Deal
          </p>
        </div>
      </div>
    </section>
  );
}
