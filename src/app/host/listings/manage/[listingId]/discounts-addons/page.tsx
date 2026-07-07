'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import HostDashboardShell, { DashboardHeading } from '@/app/host/_components/HostDashboardShell';
import DiscountsForm from '@/components/features/DiscountsForm';
import AddonsForm from '@/components/features/AddonsForm';
import { ArrowLeft } from 'lucide-react';

export default function DiscountsAddonsPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = parseInt(params.listingId as string, 10);
  const [activeTab, setActiveTab] = useState<'discounts' | 'addons'>('discounts');

  if (isNaN(listingId)) {
    return (
      <HostDashboardShell active="listings">
        <div className="text-center py-12">
          <p className="text-red-600">Invalid listing ID</p>
        </div>
      </HostDashboardShell>
    );
  }

  return (
    <HostDashboardShell active="listings">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <DashboardHeading
            title="Discounts & Add-ons"
            subtitle="Manage pricing strategies and service offerings for your listing"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('discounts')}
            className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'discounts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Discounts
          </button>
          <button
            onClick={() => setActiveTab('addons')}
            className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'addons'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Service Add-ons
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {activeTab === 'discounts' && (
            <DiscountsForm
              listingId={listingId}
              onSave={() => {
                /* Optional: trigger refresh */
              }}
            />
          )}

          {activeTab === 'addons' && (
            <AddonsForm
              listingId={listingId}
              onSave={() => {
                /* Optional: trigger refresh */
              }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Listing
          </button>
          <p className="text-xs text-gray-500">
            Changes are saved automatically
          </p>
        </div>
      </div>
    </HostDashboardShell>
  );
}
