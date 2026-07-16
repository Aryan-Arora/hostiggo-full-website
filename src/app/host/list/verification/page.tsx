'use client';

import { ShieldCheck, Eye, MessageSquare, QrCode } from 'lucide-react';
import WizardShell from '../_components/WizardShell';

const STEPS = [
  { n: 1, title: 'Scan QR Code', desc: "Open your phone's camera and point it at the QR code to instantly launch the HOSTIGGO app." },
  { n: 2, title: 'Record Live Video', desc: 'Follow the in-app prompts to record a 15-second video of yourself and your property exterior.' },
  { n: 3, title: 'Secure Upload', desc: 'Your video is encrypted and uploaded directly from your phone to our secure servers.' },
];

export default function VerificationPage() {
  return (
    <WizardShell
      step={10}
      title="Security starts with verification"
      subtitle="To maintain the highest level of trust on Hostiggo, we require all hosts to complete a quick mobile video verification."
      nextLabel="Verify via App"
    >
      {/* Trust chips */}
      <div className="flex flex-wrap gap-4 mb-10 justify-center">
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-800">Identity Secured</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full">
          <Eye className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-800">Property Verified</span>
        </div>
      </div>

      {/* Interface */}
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-card border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left: steps */}
          <div className="space-y-10">
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">How it works</h2>
              <p className="text-sm text-gray-500">
                Complete your verification in three simple steps using the mobile
                app for a secure, direct upload.
              </p>
            </div>
            <div className="space-y-8">
              {STEPS.map((s) => (
                <div key={s.n} className="flex gap-6 group">
                  <span className="shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center group-hover:scale-110 transition-transform">
                    {s.n}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-1">{s.title}</h3>
                    <p className="text-sm text-gray-500">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-6 border-t border-gray-100">
              <button className="flex items-center gap-2 text-blue-600 font-bold hover:underline">
                <MessageSquare className="w-5 h-5" />
                Send link via SMS instead
              </button>
            </div>
          </div>

          {/* Right: QR */}
          <div className="flex flex-col items-center justify-center bg-gray-50 rounded-3xl p-10 text-center relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#2563eb 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
            <div className="relative z-10 space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm inline-block border-4 border-blue-50">
                <div className="w-44 h-44 flex items-center justify-center bg-gray-100 rounded-lg">
                  <QrCode className="w-28 h-28 text-blue-600" strokeWidth={1.5} />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-bold text-gray-800">Ready to scan?</p>
                <p className="text-sm text-gray-500 max-w-[280px] mx-auto">
                  Scan this code with your mobile device to verify your listing.
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full">
                <button className="bg-blue-600 text-white font-bold py-4 rounded-full shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-all">
                  Verify via App
                </button>
                <p className="text-xs text-gray-500">
                  Don&apos;t have the app?{' '}
                  <span className="text-gray-400 font-bold" title="Coming soon">
                    Download now (coming soon)
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WizardShell>
  );
}
