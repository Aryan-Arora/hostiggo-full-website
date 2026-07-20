'use client';

import { Send, Home, PartyPopper, type LucideIcon } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const STEPS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Send, title: '1. Send Invite', desc: 'Share your unique referral link with fellow property owners.' },
  { icon: Home, title: '2. Friend Lists', desc: 'Your friend lists their first property on Hostiggo using your link.' },
  { icon: PartyPopper, title: '3. Earn Rewards', desc: 'Both you and your friend enjoy 0% commission for 3 months.' },
];

// There is no referral system in the backend yet — no referral codes,
// tracking, or reward ledger exist anywhere in the schema. This page
// previously showed a hardcoded fake code, fake ₹28,900 earnings, and a
// fake referral history table as if they were real account data. Until the
// program actually exists, show it as "coming soon" instead of fabricating
// numbers.
export default function ReferPage() {
  return (
    <div className="min-h-screen bg-figma-cream">
      <Navbar />
      <main className="container-main py-10">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#004772] to-[#0086d8] p-8 md:p-12 mb-12">
          <div className="relative z-10 max-w-xl">
            <span className="inline-block px-4 py-1 bg-white/20 text-white text-xs font-semibold rounded-full mb-4">
              Limited Offer
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Share the love, get 0% commission
            </h1>
            <p className="text-lg text-white/80">
              Invite your friends to host on Hostiggo. When they list their first property,
              you both get 3 months of zero commission fees on all bookings.
            </p>
          </div>
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        </section>

        {/* Coming soon — no referral tracking/reward system exists yet */}
        <div className="bg-white rounded-3xl p-10 shadow-card border border-gray-200 mb-16 text-center">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Referral program coming soon</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            We&apos;re still building referral codes, tracking, and rewards. This page will show your
            real referral link and earnings once that&apos;s live.
          </p>
        </div>

        {/* How it works */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-figma-navy/5 rounded-3xl flex items-center justify-center text-figma-navy mb-6">
                    <Icon className="w-9 h-9" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 mb-2">{s.title}</h4>
                  <p className="text-sm text-gray-500">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
