'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import WizardShell from '../_components/WizardShell';
import { cn } from '@/lib/utils';

const RULES: { id: string; label: string; icon: LucideIcon; on: boolean }[] = [
  { id: 'smoking', label: 'Smoking allowed', icon: Cigarette, on: false },
  { id: 'pets', label: 'Pets allowed', icon: PawPrint, on: true },
  { id: 'parties', label: 'Parties or events allowed', icon: PartyPopper, on: false },
];

const SAFETY: { id: string; label: string; desc: string; icon: LucideIcon; on: boolean }[] = [
  { id: 'cameras', label: 'Security cameras', desc: 'Located in public areas only.', icon: Video, on: true },
  { id: 'smoke', label: 'Smoke alarm', desc: 'Functional alarms in all rooms.', icon: ShieldAlert, on: true },
  { id: 'extinguisher', label: 'Fire extinguisher', desc: 'Located in the kitchen.', icon: FireExtinguisher, on: false },
  { id: 'firstaid', label: 'First aid kit', desc: 'Available in the utility closet.', icon: BriefcaseMedical, on: false },
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
  const [rules, setRules] = useState(() => Object.fromEntries(RULES.map((r) => [r.id, r.on])));
  const [safety, setSafety] = useState(() => Object.fromEntries(SAFETY.map((s) => [s.id, s.on])));

  return (
    <WizardShell
      step={8}
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
                { label: 'Quiet hours from', value: '10:00 PM' },
                { label: 'Quiet hours to', value: '08:00 AM' },
              ].map((f) => (
                <div key={f.label} className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {f.label}
                  </label>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white">
                    <span className="text-sm font-bold text-gray-800">{f.value}</span>
                    <Clock className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Check-in time', opts: ['02:00 PM', '03:00 PM', '04:00 PM'] },
                { label: 'Check-out time', opts: ['10:00 AM', '11:00 AM', '12:00 PM'] },
              ].map((f) => (
                <div key={f.label} className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {f.label}
                  </label>
                  <select className="w-full p-4 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    {f.opts.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
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

          <section className="bg-white p-6 rounded-2xl shadow-card border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-800">Safety Details</h2>
            </div>
            <div className="space-y-4">
              {SAFETY.map((s) => {
                const Icon = s.icon;
                const on = safety[s.id];
                return (
                  <button
                    key={s.id}
                    onClick={() => setSafety((p) => ({ ...p, [s.id]: !p[s.id] }))}
                    className="w-full flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all text-left"
                  >
                    <Icon className="w-5 h-5 text-gray-500 mt-1" />
                    <div className="flex-grow">
                      <p className="text-sm font-bold text-gray-800">{s.label}</p>
                      <p className="text-xs text-gray-500">{s.desc}</p>
                    </div>
                    <Check on={on} />
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </WizardShell>
  );
}
