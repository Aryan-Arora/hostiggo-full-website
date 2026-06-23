'use client';

import Link from 'next/link';
import { ChevronRight, Camera, Award, ShieldCheck, Mail, Phone } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function GuestProfilePage() {
  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <Navbar />
      <main className="container-main py-8">
        <nav className="flex items-center gap-2 py-4 text-gray-500 text-sm">
          <span>Account</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-blue-600 font-bold">Profile</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Summary */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-card border border-gray-200">
              <div className="flex flex-col items-center text-center">
                <div className="relative w-32 h-32 mb-6">
                  <img
                    src="https://i.pravatar.cc/200?img=45"
                    alt="Julianne Davenport"
                    className="w-full h-full rounded-full object-cover border-4 border-blue-100 shadow-lg"
                  />
                  <button className="absolute bottom-1 right-1 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">Julianne Davenport</h1>
                <p className="text-sm text-gray-500 mb-4">Guest since 2023</p>
                <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-1.5 rounded-full mb-6">
                  <Award className="w-4 h-4" />
                  <span className="text-sm font-bold">Gold Member</span>
                </div>
                <div className="w-full pt-6 border-t border-gray-100 space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-sm text-gray-500">Total Trips</span>
                    <span className="text-sm text-blue-600 font-bold">14</span>
                  </div>
                  <div className="flex justify-between items-center px-2">
                    <span className="text-sm text-gray-500">Wishlists</span>
                    <span className="text-sm text-blue-600 font-bold">8</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Identity verified</p>
                <p className="text-xs text-gray-500">Email, phone & ID confirmed</p>
              </div>
            </div>
          </aside>

          {/* Details */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 mb-6">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Full Name', value: 'Julianne Davenport', type: 'text' },
                  { label: 'Email', value: 'julianne.d@hostiggo.com', type: 'email' },
                  { label: 'Phone', value: '+1 (555) 012-3456', type: 'tel' },
                  { label: 'Location', value: 'New Delhi, India', type: 'text' },
                ].map((f) => (
                  <div key={f.label} className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 ml-1">{f.label}</label>
                    <input
                      type={f.type}
                      defaultValue={f.value}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 active:scale-95 transition-all">
                  Save Changes
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 mb-6">Contact Preferences</h2>
              <div className="space-y-4">
                {[
                  { icon: Mail, label: 'Email notifications', desc: 'Booking updates and offers' },
                  { icon: Phone, label: 'SMS alerts', desc: 'Time-sensitive trip reminders' },
                ].map((p) => {
                  const Icon = p.icon;
                  return (
                    <div
                      key={p.label}
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-200"
                    >
                      <div className="flex items-center gap-4">
                        <Icon className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-bold text-gray-800">{p.label}</p>
                          <p className="text-xs text-gray-500">{p.desc}</p>
                        </div>
                      </div>
                      <Link href="/account/settings" className="text-sm text-blue-600 font-bold hover:underline">
                        Manage
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
