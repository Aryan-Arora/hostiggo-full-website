'use client';

import { useState } from 'react';
import { Sparkles, Share2, Wallet, Send, ClipboardCheck, Gift, SlidersHorizontal, Download, type LucideIcon } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const STEPS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Send, title: '1. Send Invitation', desc: 'Share your unique link via social media, email, or direct message to your network.' },
  { icon: ClipboardCheck, title: '2. Host Signs Up', desc: 'Your friend registers as a host and completes their first professional listing.' },
  { icon: Gift, title: '3. Unlock Rewards', desc: 'Both you and your referral get 0% commission on platform fees for 90 days.' },
];

const ROWS = [
  { name: 'Ananya Sharma', date: '12 Oct, 2023', reward: 'Active (2mo left)', cls: 'bg-green-100 text-green-700' },
  { name: 'Rohan Verma', date: '28 Sep, 2023', reward: 'Pending', cls: 'bg-gray-100 text-gray-600' },
  { name: 'Meera Kapoor', date: '05 Sep, 2023', reward: 'Completed', cls: 'bg-blue-100 text-blue-700' },
];

export default function ReferralDashboardPage() {
  const [copied, setCopied] = useState(false);

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <Navbar />
      <main className="container-main py-10">
        {/* Hero */}
        <section className="relative w-full rounded-3xl overflow-hidden shadow-card mb-8">
          <div className="bg-gradient-to-r from-[#1B3FA0] to-[#0086D8] p-8 md:p-14">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-1 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-semibold">LIMITED TIME OFFER</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 max-w-2xl">
              Refer a Host, Get 0% Commission for 3 Months
            </h1>
            <p className="text-lg text-white/80 mb-8 max-w-2xl">
              Share the love of hosting. For every new host that signs up using your link,
              both of you enjoy zero fees on your next bookings.
            </p>
            <div className="flex gap-4">
              <button className="bg-white text-blue-700 px-8 py-3 rounded-2xl font-bold hover:scale-105 transition-transform">
                Invite Now
              </button>
              <button className="bg-white/10 backdrop-blur-md text-white px-8 py-3 rounded-2xl font-bold border border-white/20 hover:bg-white/20 transition-all">
                View Terms
              </button>
            </div>
          </div>
        </section>

        {/* Link + earnings */}
        <div className="grid grid-cols-12 gap-6 mb-16">
          <div className="col-span-12 lg:col-span-7 bg-white rounded-3xl p-8 shadow-card border border-gray-200">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-2">Your Referral Link</h2>
                <p className="text-sm text-gray-500">
                  Share this link with friends and start earning rewards together.
                </p>
              </div>
              <Share2 className="w-7 h-7 text-blue-600" />
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200 mb-8">
              <input
                readOnly
                value="hostiggo.com/refer/HOST_29384_UX"
                className="bg-transparent border-none focus:ring-0 text-sm flex-grow outline-none text-gray-700"
              />
              <button
                onClick={() => {
                  navigator.clipboard?.writeText('hostiggo.com/refer/HOST_29384_UX');
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-all active:scale-95"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5 bg-blue-600 rounded-3xl p-8 shadow-card text-white relative overflow-hidden">
            <Wallet className="absolute -right-6 -bottom-6 w-44 h-44 opacity-10" />
            <h2 className="text-lg font-bold mb-8">Total Referral Earnings</h2>
            <div className="space-y-6 relative z-10">
              <div>
                <span className="text-sm text-white/70">Commission Saved</span>
                <div className="text-4xl font-bold mt-1">$1,240.00</div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                <div>
                  <span className="text-xs text-white/70">Successful Referrals</span>
                  <div className="text-xl font-bold">12</div>
                </div>
                <div>
                  <span className="text-xs text-white/70">Pending Rewards</span>
                  <div className="text-xl font-bold">$150.00</div>
                </div>
              </div>
              <button className="w-full bg-white/10 backdrop-blur-md border border-white/20 py-3 rounded-2xl text-sm font-bold hover:bg-white hover:text-blue-700 transition-all">
                Redeem Credits
              </button>
            </div>
          </div>
        </div>

        {/* How it works */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Start earning in three simple steps. Our referral program is designed to reward
              you for growing our professional host community.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={i}
                  className="bg-white p-8 rounded-3xl shadow-card text-center border border-gray-200 hover:-translate-y-2 transition-transform"
                >
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3">{s.title}</h3>
                  <p className="text-sm text-gray-500">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Table */}
        <section className="bg-white rounded-3xl overflow-hidden shadow-card border border-gray-200">
          <div className="p-8 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Recent Referrals</h2>
              <p className="text-sm text-gray-500 mt-1">Monitor your invitation status and earnings.</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                <SlidersHorizontal className="w-4 h-4" /> Filter
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[560px]">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-8 py-4">Name</th>
                  <th className="px-8 py-4">Joined Date</th>
                  <th className="px-8 py-4">Reward Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ROWS.map((r) => (
                  <tr key={r.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-5 font-bold text-gray-800">{r.name}</td>
                    <td className="px-8 py-5 text-sm text-gray-500">{r.date}</td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${r.cls}`}>
                        {r.reward}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
