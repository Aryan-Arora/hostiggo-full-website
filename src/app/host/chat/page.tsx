'use client';

import HostDashboardShell, { DashboardHeading } from '../_components/HostDashboardShell';

export default function HostChatPage() {
  return (
    <HostDashboardShell active="chat">
      <DashboardHeading
        title="Messages"
        subtitle="Communicate with your guests about bookings and inquiries."
      />
      
      <div className="bg-white rounded-3xl p-8 shadow-card border border-gray-200 text-center">
        <p className="text-gray-500">Chat feature coming soon</p>
      </div>
    </HostDashboardShell>
  );
}
