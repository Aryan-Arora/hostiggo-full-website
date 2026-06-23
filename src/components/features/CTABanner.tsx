import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";

const CHART_BARS = [35, 60, 45, 88, 62, 75, 50, 92];

export default function CTABanner() {
  return (
    <section className="rounded-3xl overflow-hidden">
      <div
        className="relative flex flex-col md:flex-row items-center justify-between gap-8 p-8 md:p-10"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)" }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-blue-500 opacity-[0.07] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 left-1/4 w-48 h-48 rounded-full bg-indigo-400 opacity-[0.07] blur-3xl pointer-events-none" />

        {/* ── Left: Copy ── */}
        <div className="relative z-10 flex-1 max-w-sm">
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">
            For property owners
          </p>
          <h2 className="text-white text-xl md:text-[22px] font-extrabold leading-snug mb-3">
            Do you want to earn<br />effortlessly?
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            List your homestay or property and start earning by hosting travellers from across India. Join thousands of hosts already earning on HostiGo.
          </p>

          <Link
            href="/host/list/property-type"
            className="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-900/30 group"
          >
            Get started
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* ── Right: earnings card ── */}
        <div className="relative z-10 flex-shrink-0">
          <div className="bg-amber-400 rounded-2xl p-5 w-[220px] shadow-2xl shadow-black/30">
            {/* Profile row */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-full bg-amber-600 flex items-center justify-center text-white text-sm font-bold">
                R
              </div>
              <div>
                <p className="text-amber-900 text-[12px] font-bold leading-tight">Rahul Kumar</p>
                <p className="text-amber-700 text-[10px]">New Delhi · Host</p>
              </div>
            </div>

            {/* Stat */}
            <div className="bg-amber-500/50 rounded-xl p-3 mb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-amber-900 text-[10px] font-semibold">Monthly Earnings</p>
                <TrendingUp className="w-3 h-3 text-amber-900 opacity-70" />
              </div>
              <p className="text-amber-900 text-lg font-extrabold">₹42,800</p>

              {/* Mini bar chart */}
              <div className="flex items-end gap-0.5 h-8 mt-2">
                {CHART_BARS.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-amber-700 rounded-t opacity-70"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Badge */}
            <div className="text-center">
              <span className="text-amber-900 text-[11px] font-extrabold tracking-tight">
                Rupi<span className="text-amber-700">Gold</span>
              </span>
              <p className="text-amber-800 text-[9px] mt-0.5 font-medium">Your earnings dashboard</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
