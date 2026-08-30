'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ChevronLeft,
  CreditCard,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { cn } from '@/lib/utils';

const SUPPORT_EMAIL = 'support@hostiggo.com';

const CATEGORIES = [
  {
    id: 'technical',
    icon: Wrench,
    title: 'Technical issue',
    body: "Something on the site or app isn't working the way it should.",
  },
  {
    id: 'payment',
    icon: CreditCard,
    title: 'Payment or booking',
    body: 'A charge, refund, or booking that looks wrong.',
  },
  {
    id: 'grievance',
    icon: ShieldAlert,
    title: 'Safety or grievance',
    body: "A safety concern, or a grievance under our Privacy Policy.",
  },
] as const;

type CategoryId = (typeof CATEGORIES)[number]['id'];

export default function ReportIssuePage() {
  const [category, setCategory] = useState<CategoryId>('technical');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');

  const selectedCategory = CATEGORIES.find((c) => c.id === category)!;

  const mailtoHref = useMemo(() => {
    const finalSubject = `[${selectedCategory.title}] ${subject || 'Issue report'}`;
    const bodyLines = [
      description || '(describe the issue here)',
      '',
      '---',
      `Category: ${selectedCategory.title}`,
      email ? `My contact email: ${email}` : null,
    ].filter(Boolean);

    const params = new URLSearchParams({
      subject: finalSubject,
      body: bodyLines.join('\n'),
    });
    // URLSearchParams encodes spaces as "+"; mailto needs %20.
    return `mailto:${SUPPORT_EMAIL}?${params.toString().replace(/\+/g, '%20')}`;
  }, [selectedCategory, subject, description, email]);

  const canSend = description.trim().length > 0;

  return (
    <div className="min-h-screen bg-figma-cream">
      <Navbar />
      <main className="container-main py-10 md:py-14">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-figma-ink/60 hover:text-figma-navy mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> Back to home
        </Link>

        <header className="mb-10 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold text-figma-ink mb-3">
            Report an Issue
          </h1>
          <p className="text-[15px] leading-7 text-figma-ink/80">
            Pick what this is about, describe what happened, and we&apos;ll
            open it as an email straight to our support inbox from your own
            mail app — nothing is sent without you hitting send yourself.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const selected = c.id === category;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={cn(
                  'text-left bg-white rounded-3xl border p-6 md:p-8 transition-colors',
                  selected
                    ? 'border-figma-navy ring-1 ring-figma-navy'
                    : 'border-figma-border hover:border-figma-navy/40',
                )}
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                    selected
                      ? 'bg-figma-navy text-white'
                      : 'bg-figma-navy/5 text-figma-navy',
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-semibold text-figma-ink mb-2">
                  {c.title}
                </h2>
                <p className="text-[15px] leading-7 text-figma-ink/70">
                  {c.body}
                </p>
              </button>
            );
          })}
        </section>

        <section className="bg-white rounded-3xl border border-figma-border p-6 md:p-10">
          <h2 className="text-xl md:text-2xl font-semibold text-figma-ink mb-6">
            Describe what happened
          </h2>

          <div className="space-y-5 max-w-2xl">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-figma-ink/50 mb-1.5">
                Subject
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Short summary of the issue"
                className="w-full rounded-xl border border-figma-border px-4 py-3 text-[15px] text-figma-ink outline-none focus:border-figma-navy"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-figma-ink/50 mb-1.5">
                What happened
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder="Include the booking ID, listing, or dates if relevant — the more detail, the faster we can help."
                className="w-full rounded-xl border border-figma-border px-4 py-3 text-[15px] text-figma-ink outline-none focus:border-figma-navy resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-figma-ink/50 mb-1.5">
                Your email (optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="So we can reply if it's different from your Hostiggo account email"
                className="w-full rounded-xl border border-figma-border px-4 py-3 text-[15px] text-figma-ink outline-none focus:border-figma-navy"
              />
            </div>

            <a
              href={canSend ? mailtoHref : undefined}
              aria-disabled={!canSend}
              className={cn(
                'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-colors',
                canSend
                  ? 'bg-figma-navy text-white hover:bg-figma-navy/90'
                  : 'bg-figma-border text-figma-ink/40 cursor-not-allowed pointer-events-none',
              )}
            >
              <AlertTriangle className="w-4 h-4" />
              Open email to {SUPPORT_EMAIL}
            </a>
            <p className="text-xs text-figma-ink/50">
              This opens your default mail app with the message pre-filled —
              you still need to hit send there.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
