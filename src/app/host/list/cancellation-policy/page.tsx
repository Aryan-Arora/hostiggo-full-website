'use client';

import { useEffect, useState } from 'react';
import { CalendarClock, CalendarX2, ShieldAlert } from 'lucide-react';
import WizardShell, { OptionCard } from '../_components/WizardShell';
import { useListingDraft } from '@/context/ListingDraftContext';

type Policy = 'flexible' | 'moderate' | 'strict';

// Copy matches /cancellation (the public Cancellation & Refund Policy page)
// exactly -- these three tiers, thresholds, and the "excluding taxes and
// Hostiggo fees" framing are the platform-wide rules a host is choosing
// between, not something they're free to redefine.
const POLICIES: { id: Policy; icon: typeof CalendarClock; name: string; desc: string }[] = [
  {
    id: 'flexible',
    icon: CalendarClock,
    name: 'Flexible',
    desc: 'Full refund if cancelled 24+ hours before check-in. No refund within 24 hours.',
  },
  {
    id: 'moderate',
    icon: CalendarX2,
    name: 'Moderate',
    desc: 'Full refund if cancelled 5+ days before check-in. Partial refund within 5 days.',
  },
  {
    id: 'strict',
    icon: ShieldAlert,
    name: 'Strict',
    desc: 'Partial refund if cancelled 7+ days before check-in. No refund within 7 days.',
  },
];

const DEFAULT_STRICT_PERCENT = 50;

export default function CancellationPolicyPage() {
  const { draft, update } = useListingDraft();
  const [selected, setSelected] = useState<Policy>(draft.cancellationPolicy ?? 'moderate');
  // Stored on the draft/DB as a 0-1 fraction; edited here as a whole
  // percentage since that's what a host actually thinks in.
  const [strictPercent, setStrictPercent] = useState<number>(
    Math.round((draft.strictPartialRefundPercent ?? DEFAULT_STRICT_PERCENT / 100) * 100),
  );

  // Moderate is pre-selected visually by default -- without this, a host
  // who never touches this step would have that shown as "chosen" but the
  // draft itself would stay unset (createListing() falls back to the same
  // 'moderate' default server-side, so the outcome matches either way, but
  // seed it explicitly so what's displayed always matches what's saved).
  useEffect(() => {
    if (!draft.cancellationPolicy) update({ cancellationPolicy: selected });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = (id: Policy) => {
    setSelected(id);
    update({
      cancellationPolicy: id,
      strictPartialRefundPercent: id === 'strict' ? strictPercent / 100 : undefined,
    });
  };

  const updateStrictPercent = (pct: number) => {
    const clamped = Math.min(100, Math.max(0, pct));
    setStrictPercent(clamped);
    update({ strictPartialRefundPercent: clamped / 100 });
  };

  return (
    <WizardShell
      step={12}
      title="Choose a cancellation policy"
      subtitle="This determines how much a guest is refunded if they cancel. Hostiggo defines these policies platform-wide -- pick which one applies to this listing."
      nextDisabled={!selected}
    >
      <div className="max-w-2xl mx-auto space-y-4">
        {POLICIES.map((p) => (
          <div key={p.id}>
            <OptionCard selected={selected === p.id} onClick={() => select(p.id)}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-figma-navy/10 flex items-center justify-center text-figma-navy shrink-0">
                  <p.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">{p.name}</h3>
                  <p className="text-sm text-gray-500">{p.desc}</p>
                </div>
              </div>
            </OptionCard>

            {/* Sibling, not nested inside OptionCard -- OptionCard renders a
                <button>, and an <input> can't validly nest inside one. */}
            {p.id === 'strict' && selected === 'strict' && (
              <div className="mt-2 ml-1 flex flex-wrap items-center gap-3 bg-figma-navy/5 border border-figma-navy/10 rounded-xl px-4 py-3">
                <label htmlFor="strictPercent" className="text-sm font-semibold text-gray-700">
                  Partial refund amount
                </label>
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                  <input
                    id="strictPercent"
                    type="number"
                    min={0}
                    max={100}
                    value={strictPercent}
                    onChange={(e) => updateStrictPercent(Number(e.target.value) || 0)}
                    className="w-12 bg-transparent text-sm font-semibold text-gray-900 outline-none p-0 border-none focus:ring-0 text-center"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <span className="text-xs text-gray-500">
                  of the refundable amount, if cancelled 7+ days before check-in
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </WizardShell>
  );
}
