'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
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

// feedback.category enum values these map to.
const CATEGORY_ENUM: Record<string, string> = {
  technical: 'app_performance',
  payment: 'payments_payouts',
  grievance: 'others',
};

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
  return (
    <Suspense fallback={<div className="min-h-screen bg-figma-cream" />}>
      <ReportIssueContent />
    </Suspense>
  );
}

function ReportIssueContent() {
  const searchParams = useSearchParams();
  const bookingRef = searchParams?.get('booking');
  const [category, setCategory] = useState<CategoryId>('technical');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sentRef, setSentRef] = useState<string | null>(null);

  // Arriving from a booking page: it's about that booking.
  useEffect(() => {
    if (bookingRef && /^\d+$/.test(bookingRef)) {
      setCategory('payment');
      setSubject((s) => s || `Booking #${bookingRef}`);
    }
  }, [bookingRef]);

  const handleSubmit = async () => {
    const text = description.trim();
    if (text.length < 10) {
      toast.error('Please describe the issue in a little more detail.', { id: 'report' });
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      toast.error('Enter a valid email, or leave it blank.', { id: 'report' });
      return;
    }
    setSending(true);
    try {
      const header = [
        `[${selectedCategory.title}] ${subject.trim() || 'Issue report'}`,
        bookingRef ? `Booking: #${bookingRef}` : null,
        email.trim() ? `Reply to: ${email.trim()}` : null,
      ]
        .filter(Boolean)
        .join('\n');
      const created = await api.submitFeedback({
        type: 'report_issue',
        category: CATEGORY_ENUM[category] ?? 'others',
        description: `${header}\n\n${text}`.slice(0, 5000),
      });
      setSentRef(created?.id ? `HG-R${created.id}` : 'received');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "We couldn't send that. Please try again.",
        { id: 'report' },
      );
    } finally {
      setSending(false);
    }
  };

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
            Pick what this is about and describe what happened. It goes straight
            to our support team -- urgent safety and payment issues are handled
            first.
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
                maxLength={4000}
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

            {sentRef ? (
              <div role="status" className="flex items-start gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                <div className="text-[14px] text-emerald-900">
                  <p className="font-semibold">Thanks -- your report has been sent.</p>
                  <p>
                    {sentRef !== 'received' && <>Reference <strong>{sentRef}</strong>. </>}
                    We usually reply within a few hours.
                  </p>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSend || sending}
                className={cn(
                  'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-colors',
                  canSend && !sending
                    ? 'bg-figma-navy text-white hover:bg-figma-navy/90'
                    : 'bg-figma-border text-figma-ink/40 cursor-not-allowed',
                )}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                {sending ? 'Sending…' : 'Send report'}
              </button>
            )}
            <p className="text-xs text-figma-ink/50">
              Prefer email? Write to{' '}
              <a href={mailtoHref} className="underline">
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
