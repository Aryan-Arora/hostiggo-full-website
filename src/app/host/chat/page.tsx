'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Plus, Bell, HelpCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ChatWorkspace from '@/components/features/ChatWorkspace';
import HostSidebar from '../_components/HostDashboardShell';

export default function HostChatPage() {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const avatar = user?.profile_pic_url || 'https://i.pravatar.cc/100?img=12';

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-800 lg:pl-64 flex flex-col">
      {/* Desktop sidebar - reuse from shell but simplified */}
      <aside className="hidden lg:flex flex-col h-screen fixed left-0 top-0 py-8 px-4 border-r border-gray-200 bg-white w-64 z-40">
        <div className="mb-10 px-2">
          <Link href="/" className="text-lg font-extrabold text-gray-900">
            HOSTI<span className="text-blue-600">GGO</span>
          </Link>
          <p className="text-sm text-gray-500 mt-1">Host Dashboard</p>
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85%] bg-white flex flex-col py-8 px-4 shadow-2xl">
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="absolute top-4 right-4 p-2 text-gray-500 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-10 px-2">
              <Link href="/" className="text-lg font-extrabold text-gray-900">
                HOSTI<span className="text-blue-600">GGO</span>
              </Link>
              <p className="text-sm text-gray-500 mt-1">Host Dashboard</p>
            </div>
          </aside>
        </div>
      )}

      {/* Top bar */}
      <header className="sticky top-0 z-30 flex justify-between items-center px-4 md:px-6 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/" className="text-lg font-extrabold text-gray-900">
            HOSTI<span className="text-blue-600">GGO</span>
          </Link>
        </div>
        <div className="hidden lg:block" />
        <div className="flex items-center gap-2 md:gap-3">
          <Link
            href="/host/list/property-type"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 sm:px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-blue-700 transition-all active:scale-[0.99]"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Create Listing</span>
          </Link>
          <button
            aria-label="Notifications"
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all"
          >
            <Bell className="w-5 h-5" />
          </button>
          <button
            aria-label="Help"
            className="hidden sm:inline-flex p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <Link
            href="/host/account"
            aria-label="Host account"
            className="w-8 h-8 rounded-full overflow-hidden ml-1 border border-gray-200"
          >
            <img
              src={avatar}
              alt={user?.name || 'Host profile'}
              className="w-full h-full object-cover"
            />
          </Link>
        </div>
      </header>

      {/* Chat takes full remaining space */}
      <main className="flex-1 overflow-hidden">
        <ChatWorkspace audience="host" initialSelectedId="sanjay-booking" />
      </main>
    </div>
  );
}
