'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Copy, Check, Users, Gift, TrendingUp, MessageSquare, Mail, Share2, ArrowRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const REFERRAL_BENEFITS = [
  {
    title: 'You Get',
    items: [
      '0% commission for 3 months',
      'Referral bonus: ₹5,000 per friend',
      'Priority support access',
    ],
  },
  {
    title: 'Your Friend Gets',
    items: [
      '0% commission for 3 months',
      'Welcome bonus: ₹2,500',
      'Free property photos setup',
    ],
  },
];

const REFERRAL_HISTORY = [
  {
    name: 'Sarah Johnson',
    property: 'Villa in Bali',
    joinedDate: 'Mar 15, 2024',
    status: 'active',
    earnings: '₹15,000',
  },
  {
    name: 'Mike Chen',
    property: 'Apartment in Bangkok',
    joinedDate: 'Feb 28, 2024',
    status: 'active',
    earnings: '₹15,000',
  },
  {
    name: 'Emma Wilson',
    property: 'Cottage in Lake District',
    joinedDate: 'Feb 10, 2024',
    status: 'pending',
    earnings: 'Pending',
  },
];

export default function ReferPage() {
  const [copied, setCopied] = useState(false);
  const referralCode = 'SANJ839102';
  const referralLink = `https://hostiggo.com?ref=${referralCode}`;

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="container-main py-12 md:py-16 lg:py-20">
        {/* Hero Section */}
        <section className="mb-16 md:mb-20 max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
            Earn by sharing Hostiggo
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
            Invite property owners you know. When they list their first property, you both get 0% commission for 3 months. It's that simple.
          </p>
          <div className="flex gap-3">
            <button className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Get Started
            </button>
            <button className="px-8 py-3 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
              Learn More
            </button>
          </div>
        </section>

        {/* Stats Row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 md:mb-20">
          <div className="p-8 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Active Referrals</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">12</p>
            <p className="text-sm text-gray-500 mt-2">Friends who've listed</p>
          </div>

          <div className="p-8 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Gift className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Total Earnings</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">₹1,80,000</p>
            <p className="text-sm text-gray-500 mt-2">From referral bonuses</p>
          </div>

          <div className="p-8 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Commission Saved</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">₹3,45,000</p>
            <p className="text-sm text-gray-500 mt-2">In 0% commission periods</p>
          </div>
        </section>

        {/* Referral Link Section */}
        <section className="mb-16 md:mb-20 bg-blue-50 rounded-2xl p-8 md:p-10 border border-blue-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Referral Link</h2>

          <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 flex items-center justify-between gap-4">
            <code className="text-sm md:text-base text-gray-700 font-mono break-all flex-1">
              {referralLink}
            </code>
            <button
              onClick={() => handleCopy(referralLink)}
              className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Copy link"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Or share your code:</h3>
            <div className="p-4 bg-white rounded-lg border border-gray-200 flex items-center justify-between gap-4">
              <span className="text-lg font-bold text-gray-900">{referralCode}</span>
              <button
                onClick={() => handleCopy(referralCode)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy Code'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-medium text-gray-600">Share via:</span>
            <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-white rounded-lg border border-gray-200 hover:border-gray-300 text-gray-700 transition-colors">
              <Mail className="w-4 h-4" /> Email
            </button>
            <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-white rounded-lg border border-gray-200 hover:border-gray-300 text-gray-700 transition-colors">
              <MessageSquare className="w-4 h-4" /> Message
            </button>
            <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-white rounded-lg border border-gray-200 hover:border-gray-300 text-gray-700 transition-colors">
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="mb-16 md:mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-10">What You Both Get</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {REFERRAL_BENEFITS.map((benefit) => (
              <div key={benefit.title} className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6">{benefit.title}</h3>
                <ul className="space-y-4">
                  {benefit.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center mt-0.5 flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-16 md:mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-10">How It Works</h2>
          <div className="space-y-4">
            {[
              {
                step: '1',
                title: 'Share your code',
                desc: 'Send your referral code or link to friends and property owners you know.',
              },
              {
                step: '2',
                title: 'They sign up and list',
                desc: 'When they use your code to sign up and list their first property, you both qualify.',
              },
              {
                step: '3',
                title: 'Earn your reward',
                desc: 'Get ₹5,000 bonus + 0% commission for 3 months on all bookings.',
              },
              {
                step: '4',
                title: 'Keep growing',
                desc: 'No limit on how many friends you can refer. Earn more, help more people.',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 pb-6 border-b border-gray-200 last:border-0">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Referrals */}
        {REFERRAL_HISTORY.length > 0 && (
          <section className="mb-16 md:mb-20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Referrals</h2>
              <Link href="#" className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1">
                See all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {REFERRAL_HISTORY.map((referral) => (
                <div key={referral.name} className="bg-gray-50 rounded-lg p-4 md:p-6 border border-gray-200 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{referral.name}</h3>
                    <p className="text-sm text-gray-600">{referral.property}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{referral.joinedDate}</p>
                    <p className={`text-xs font-medium mt-1 ${referral.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>
                      {referral.status === 'active' ? '✓ Active' : 'Pending'}
                    </p>
                  </div>
                  <div className="text-right font-semibold text-gray-900">{referral.earnings}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="bg-gray-900 text-white rounded-2xl p-10 md:p-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to earn?</h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Share your referral link today and start earning rewards. There's no limit to how many friends you can refer.
          </p>
          <button className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Start Referring Now
          </button>
        </section>
      </main>
      <Footer />
    </div>
  );
}
