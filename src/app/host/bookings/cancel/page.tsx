'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Info } from 'lucide-react';
import HostDashboardShell from '../../_components/HostDashboardShell';
import { cn } from '@/lib/utils';

const REASONS = [
  { id: 'unavailable', title: 'Property unavailable', desc: 'Repairs, maintenance, or double booking.' },
  { id: 'emergency', title: 'Personal emergency', desc: 'Medical issues or unavoidable personal conflicts.' },
  { id: 'natural', title: 'Natural issue', desc: 'Weather conditions or local emergencies.' },
  { id: 'other', title: 'Other', desc: 'Something else not listed above.' },
];

export default function CancelBookingPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [reason, setReason] = useState<string | null>(null);
  const reasonLabel = REASONS.find((r) => r.id === reason)?.title ?? '—';

  return (
    <HostDashboardShell active="bookings">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Link
              href="/host/bookings/details"
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-all text-blue-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="text-sm text-gray-400">Booking #HG-882193</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Cancel this reservation
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            We understand plans change. Let us know why you need to cancel so we
            can help you manage the impact on your hosting status.
          </p>
        </div>

        {step === 1 ? (
          <section>
            <p className="text-sm font-medium text-gray-800 uppercase tracking-wider mb-4">
              Why do you want to cancel?
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setReason(r.id)}
                  className={cn(
                    'text-left flex items-start p-5 border rounded-xl transition-all',
                    reason === r.id
                      ? 'border-blue-600 ring-1 ring-blue-600 bg-blue-50/40'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50',
                  )}
                >
                  <span
                    className={cn(
                      'mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                      reason === r.id ? 'border-blue-600' : 'border-gray-300',
                    )}
                  >
                    {reason === r.id && <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                  </span>
                  <div className="ml-4">
                    <span className="block text-sm font-bold text-gray-800">{r.title}</span>
                    <span className="block text-sm text-gray-500 mt-1">{r.desc}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-8 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-gray-200 pt-8">
              <Link href="/host/bookings/details" className="text-blue-600 font-bold hover:underline">
                Keep Booking
              </Link>
              <button
                disabled={!reason}
                onClick={() => setStep(2)}
                className={cn(
                  'w-full md:w-auto px-10 py-4 rounded-xl font-bold text-white shadow-md transition-all',
                  reason ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed',
                )}
              >
                Review Details
              </button>
            </div>
          </section>
        ) : (
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Impact */}
                <div className="bg-red-50 p-6 rounded-2xl flex gap-4 border border-red-100">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-red-700">Hosting Impact Notice</h4>
                    <p className="text-sm text-red-600/90 mt-1">
                      Canceling this reservation may affect your &quot;Superhost&quot; status and
                      result in a $50 administrative fee. Consider messaging the guest to find
                      an alternative.
                    </p>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-white p-6 rounded-2xl shadow-card border border-gray-200">
                  <h4 className="text-xs text-gray-500 uppercase mb-4">Reservation Summary</h4>
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                    <img
                      src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=200&h=200&fit=crop&q=80"
                      alt="Loft"
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                    <div>
                      <h5 className="text-sm font-bold text-gray-800">Skyline Serenity Loft</h5>
                      <p className="text-sm text-gray-500">Nov 14 - Nov 19 · 5 Nights</p>
                    </div>
                  </div>
                  <div className="pt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Guest</span>
                      <span className="font-bold text-gray-800">Elena Rodriguez (+2)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Reason for cancellation</span>
                      <span className="font-bold text-gray-800">{reasonLabel}</span>
                    </div>
                  </div>
                </div>

                {/* Earnings */}
                <div className="bg-gray-50 p-6 rounded-2xl">
                  <h4 className="text-xs text-gray-500 uppercase mb-4">Earnings Adjustment</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Projected Payout</span>
                      <span className="line-through text-gray-400">$840.00</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-red-500 font-bold">
                      <span>Cancellation Fee</span>
                      <span>-$50.00</span>
                    </div>
                    <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between items-center text-lg font-bold text-gray-800">
                      <span>New Total</span>
                      <span>-$50.00</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-2xl space-y-4 border border-gray-200 shadow-card">
                  <div className="flex items-center gap-3 text-blue-600">
                    <Info className="w-5 h-5" />
                    <span className="text-sm font-bold">What happens next?</span>
                  </div>
                  <ul className="space-y-3 text-sm text-gray-500 leading-relaxed">
                    <li className="flex gap-2"><span className="text-blue-600">•</span> Guest will be notified immediately.</li>
                    <li className="flex gap-2"><span className="text-blue-600">•</span> Full refund will be processed to the guest.</li>
                    <li className="flex gap-2"><span className="text-blue-600">•</span> Your calendar will be blocked for these dates.</li>
                  </ul>
                </div>
                <div className="bg-gray-100 p-6 rounded-2xl">
                  <p className="text-xs text-gray-500">
                    Need help?{' '}
                    <Link href="/support" className="text-blue-600 underline">
                      Contact Host Support
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col md:flex-row-reverse gap-4 items-center border-t border-gray-200 pt-8">
              <button className="w-full md:w-auto bg-red-500 text-white px-10 py-4 rounded-xl font-bold shadow-md hover:bg-red-600 transition-all">
                Confirm Cancellation
              </button>
              <button
                onClick={() => setStep(1)}
                className="text-gray-600 font-bold hover:underline"
              >
                Go Back
              </button>
            </div>
          </section>
        )}
      </div>
    </HostDashboardShell>
  );
}
