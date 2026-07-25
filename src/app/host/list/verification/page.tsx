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
          <ShieldCheck className="w-5 h-5 text-figma-navy" />
          <span className="text-sm font-medium text-gray-800">Identity Secured</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full">
          <Eye className="w-5 h-5 text-figma-navy" />
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
                  <span className="shrink-0 w-10 h-10 rounded-full bg-figma-navy text-white font-bold flex items-center justify-center group-hover:scale-110 transition-transform">
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
              <button
                disabled
                title="Coming soon"
                className="flex items-center gap-2 text-gray-400 font-bold cursor-not-allowed"
              >
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
              <div className="bg-white p-6 rounded-3xl shadow-sm inline-block border-4 border-figma-navy/10">
                <div className="w-44 h-44 flex items-center justify-center bg-gray-100 rounded-lg">
                  <QrCode className="w-28 h-28 text-figma-navy" strokeWidth={1.5} />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-bold text-gray-800">Ready to scan?</p>
                <p className="text-sm text-gray-500 max-w-[280px] mx-auto">
                  Scan this code with your mobile device to verify your listing.
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full">
                <button
                  disabled
                  title="Coming soon -- use the Finish button below to publish your listing"
                  className="bg-gray-200 text-gray-400 font-bold py-4 rounded-full cursor-not-allowed"
                >
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
