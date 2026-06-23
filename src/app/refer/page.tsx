'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Wallet, Copy, Share2, MessageCircle, Mail, AtSign, Send, Home, PartyPopper, ArrowRight, Check, type LucideIcon } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const STEPS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Send, title: '1. Send Invite', desc: 'Share your unique referral link with fellow property owners.' },
  { icon: Home, title: '2. Friend Lists', desc: 'Your friend lists their first property on Hostiggo using your link.' },
  { icon: PartyPopper, title: '3. Earn Rewards', desc: 'Both you and your friend enjoy 0% commission for 3 months.' },
];

const REFERRALS = [
  { initials: 'AS', name: 'Ananya Sharma', place: 'Boutique Stay, Jaipur', date: '12 Oct, 2023', status: 'Property Listed', statusClass: 'bg-green-100 text-green-700', reward: 'Active (2mo left)', rewardClass: 'text-blue-600' },
  { initials: 'RV', name: 'Rohan Verma', place: 'Mountain Villa, Shimla', date: '28 Sep, 2023', status: 'Pending Setup', statusClass: 'bg-gray-100 text-gray-600', reward: 'Waiting for Listing', rewardClass: 'text-gray-400' },
  { initials: 'MK', name: 'Meera Kapoor', place: 'Cozy Loft, Mumbai', date: '05 Sep, 2023', status: 'Property Listed', statusClass: 'bg-green-100 text-green-700', reward: 'Completed', rewardClass: 'text-gray-600' },
];

export default function ReferPage() {
  const [copied, setCopied] = useState(false);
  const code = 'SANJ839102';

  const copy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <Navbar />
      <main className="container-main py-10">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1B3FA0] to-[#0086D8] p-8 md:p-12 mb-12">
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

        {/* Stats + link */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-16">
          <div className="lg:col-span-4 bg-white rounded-3xl p-8 shadow-card border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <span className="text-sm text-gray-500">Total Referral Earnings</span>
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">₹ 28,900</h2>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="text-blue-600 font-bold">12 Bookings</span>
                <span>•</span>
                <span>4 Pending</span>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Goal Progress</span>
                <span className="text-sm font-bold text-gray-800">75%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full w-3/4" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 bg-white rounded-3xl p-8 shadow-card border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Your Referral Link</h3>
            <p className="text-sm text-gray-500 mb-8">
              Send this code to your friends or share it directly on social media.
            </p>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex items-center justify-between px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl">
                <span className="text-xl font-bold tracking-widest text-gray-900">{code}</span>
                <button
                  onClick={copy}
                  className="flex items-center gap-2 text-blue-600 hover:opacity-70 transition-all font-bold"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'Copied' : 'Copy Code'}
                </button>
              </div>
              <button className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 hover:scale-[1.02] transition-all active:scale-95">
                <Share2 className="w-5 h-5" />
                Share Link
              </button>
            </div>
            <div className="mt-8 flex items-center gap-4">
              <span className="text-sm text-gray-500">Quick Share:</span>
              <div className="flex gap-2">
                {[MessageCircle, Mail, AtSign].map((Icon, i) => (
                  <button
                    key={i}
                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-500"
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mb-6">
                    <Icon className="w-9 h-9" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 mb-2">{s.title}</h4>
                  <p className="text-sm text-gray-500">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent referrals */}
        <section>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-bold text-gray-800">Recent Referrals</h2>
            <Link
              href="/refer/dashboard"
              className="text-blue-600 font-bold text-sm flex items-center gap-1 hover:underline"
            >
              View All History <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="bg-white rounded-3xl shadow-card border border-gray-200 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Name', 'Joined Date', 'Status', 'Reward Status'].map((th, i) => (
                    <th
                      key={th}
                      className={`px-8 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider ${i === 3 ? 'text-right' : ''}`}
                    >
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {REFERRALS.map((r) => (
                  <tr key={r.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                          {r.initials}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{r.name}</p>
                          <p className="text-xs text-gray-500">{r.place}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-gray-500">{r.date}</td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${r.statusClass}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className={`px-8 py-6 text-right font-bold text-sm ${r.rewardClass}`}>
                      {r.reward}
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
