'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Home,
  Cigarette,
  PawPrint,
  PartyPopper,
  Clock,
  ShieldCheck,
  Video,
  ShieldAlert,
  FireExtinguisher,
  BriefcaseMedical,
  type LucideIcon,
  Loader2,
  Plus,
  Trash2,
  Edit2,
} from 'lucide-react';
import WizardShell from '../_components/WizardShell';
import { cn } from '@/lib/utils';
import { useListingDraft } from '@/context/ListingDraftContext';
import HouseRulesForm from '@/components/features/HouseRulesForm';
import SafetyDetailsForm from '@/components/features/SafetyDetailsForm';

const RULES: { id: string; label: string; icon: LucideIcon; on: boolean }[] = [
  { id: 'smoking', label: 'Smoking allowed', icon: Cigarette, on: false },
  { id: 'pets', label: 'Pets allowed', icon: PawPrint, on: true },
  { id: 'parties', label: 'Parties or events allowed', icon: PartyPopper, on: false },
];

function Check({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        'w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-colors',
        on ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white',
      )}
    >
      {on && (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

export default function HouseRulesPage() {
  const searchParams = useSearchParams();
  const { draft } = useListingDraft();
  const listingId = searchParams.get('listingId');
  
  const [rules, setRules] = useState(() => Object.fromEntries(RULES.map((r) => [r.id, r.on])));
  const [loading, setLoading] = useState(!!listingId);
  const [quietHoursFrom, setQuietHoursFrom] = useState('22:00');
  const [quietHoursTo, setQuietHoursTo] = useState('08:00');
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('11:00');

  useEffect(() => {
    if (listingId) {
      // Load existing rules if editing
      setLoading(false);
    }
  }, [listingId]);

  // For new listings, show the backend forms after they're created
  if (listingId && !loading) {
    return (
      <WizardShell
        step={9}
        title="Set house rules and safety details"
        subtitle="These can be managed later from your listing management dashboard"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* House Rules */}
          <div>
            <HouseRulesForm listingId={parseInt(listingId)} />
          </div>

          {/* Safety Details */}
          <div>
            <SafetyDetailsForm listingId={parseInt(listingId)} />
          </div>
        </div>
      </WizardShell>
    );
  }

  // For draft listings during wizard flow, show simple checkboxes
  return (
    <WizardShell
      step={9}
      title="Set some rules for your guests"
      subtitle="Clear rules help avoid misunderstandings and set the right expectations for your stay."
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left */}
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-card border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Home className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-800">General House Rules</h2>
            </div>
            <div className="space-y-4">
              {RULES.map((r) => {
                const Icon = r.icon;
                const on = rules[r.id];
                return (
                  <button
                    key={r.id}
                    onClick={() => setRules((s) => ({ ...s, [r.id]: !s[r.id] }))}
                    className={cn(
                      'w-full flex items-center justify-between p-4 rounded-xl border transition-colors group',
                      on ? 'border-blue-400 bg-blue-50/40' : 'border-gray-200 hover:border-blue-300',
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <Icon className={cn('w-5 h-5', on ? 'text-blue-600' : 'text-gray-500')} />
                      <span className="text-sm text-gray-800">{r.label}</span>
                    </div>
                    <Check on={on} />
                  </button>
                );
              })}
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-card border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-800">Quiet Hours &amp; Check-in</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {[
                { label: 'Quiet hours from', state: quietHoursFrom, setState: setQuietHoursFrom },
                { label: 'Quiet hours to', state: quietHoursTo, setState: setQuietHoursTo },
              ].map((f) => (
                <div key={f.label} className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {f.label}
                  </label>
                  <input
                    type="time"
                    value={f.state}
                    onChange={(e) => f.setState(e.target.value)}
                    className="w-full p-4 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Check-in time', state: checkInTime, setState: setCheckInTime },
                { label: 'Check-out time', state: checkOutTime, setState: setCheckOutTime },
              ].map((f) => (
                <div key={f.label} className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {f.label}
                  </label>
                  <input
                    type="time"
                    value={f.state}
                    onChange={(e) => f.setState(e.target.value)}
                    className="w-full p-4 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right */}
        <div className="lg:col-span-5 space-y-6">
          <section className="rounded-2xl shadow-card border border-gray-200 overflow-hidden relative min-h-[300px] flex flex-col justify-end">
            <img
              src="https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=700&h=500&fit=crop&q=80"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="relative z-10 text-white p-6">
              <h2 className="text-lg font-bold mb-2">Safety first</h2>
              <p className="text-sm opacity-90">
                Hostiggo prioritizes the safety of both hosts and guests. Please
                disclose all safety features available.
              </p>
            </div>
          </section>

          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-blue-900 mb-1">Safety Details Coming</h3>
                <p className="text-sm text-blue-800">
                  You'll be able to add detailed safety information in the next step. This includes security cameras, smoke alarms, and other safety features.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WizardShell>
  );
}
