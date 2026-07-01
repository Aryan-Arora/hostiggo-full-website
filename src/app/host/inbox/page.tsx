'use client';

import Link from 'next/link';
import { Inbox } from 'lucide-react';
import HostDashboardShell, { DashboardHeading } from '../_components/HostDashboardShell';

export default function HostInboxPage() {
  return (
    <HostDashboardShell activeKey="inbox">
      <DashboardHeading title="Inbox" subtitle="Messages from your guests" />

      <div className="flex flex-col items-center justify-center py-24 text-center px-6">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
          <Inbox className="w-10 h-10 text-blue-600" />
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">Your inbox is empty</h2>

        {/* Body */}
        <p className="text-gray-500 max-w-sm text-base leading-relaxed mb-8">
          When guests message you about your listings, you&apos;ll find them here.
        </p>

        {/* CTA */}
        <Link
          href="/host/listings"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl transition-colors"
        >
          Go to Listings
        </Link>
      </div>
    </HostDashboardShell>
  );
}
