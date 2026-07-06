'use client';

import { useState } from 'react';
import { Plus, Bell, HelpCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ChatWorkspace from '@/components/features/ChatWorkspace';
import HostDashboardShell from '../_components/HostDashboardShell';

export default function HostChatPage() {
  const { user } = useAuth();
  const avatar = user?.profile_pic_url || 'https://i.pravatar.cc/100?img=12';

  return (
    <HostDashboardShell active="chat">
      <div className="flex flex-col gap-6">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
            <p className="text-sm text-gray-500">Chat with guests and other hosts about bookings and properties.</p>
          </div>
          <button
            title="Coming soon"
            disabled
            className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2.5 rounded-full text-sm font-semibold hover:bg-blue-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            New conversation
          </button>
        </div>

        {/* Chat workspace takes remaining space */}
        <div className="flex-1 min-h-[calc(100vh-280px)]">
          <ChatWorkspace audience="host" />
        </div>
      </div>
    </HostDashboardShell>
  );
}
