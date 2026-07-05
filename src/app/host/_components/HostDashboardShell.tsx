'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  Building2,
  Wallet,
  Star,
  Settings,
  ArrowLeftRight,
  LifeBuoy,
  LogOut,
  Bell,
  HelpCircle,
  Plus,
  CalendarDays,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

import { MessageCircle } from 'lucide-react';

type NavKey =
  | 'bookings'
  | 'listings'
  | 'calendar'
  | 'earnings'
  | 'reviews'
  | 'chat'
  | 'settings';

const NAV: { key: NavKey; label: string; href: string; icon: LucideIcon }[] = [
  { key: 'listings', label: 'Properties', href: '/host/listings', icon: Building2 },
  { key: 'bookings', label: 'Reservations', href: '/host/bookings', icon: CalendarCheck },
  { key: 'calendar', label: 'Calendar', href: '/host/calendar', icon: CalendarDays },
  { key: 'chat', label: 'Messages', href: '/host/chat', icon: MessageCircle },
  { key: 'earnings', label: 'Earnings', href: '/host/earnings', icon: Wallet },
  { key: 'reviews', label: 'Reviews', href: '/host/reviews', icon: Star },
  { key: 'settings', label: 'Settings', href: '/host/settings', icon: Settings },
];

function SidebarContent({
  active,
  onLogout,
  onNavigate,
}: {
  active: NavKey;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="mb-10 px-2">
        <Link href="/" onClick={onNavigate} className="text-lg font-extrabold text-gray-900">
          HOSTI<span className="text-blue-600">GGO</span>
        </Link>
        <p className="text-sm text-gray-500 mt-1">Host Dashboard</p>
      </div>
      <div className="flex-1 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const on = item.key === active;
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onNavigate}
              aria-current={on ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium',
                on ? 'bg-blue-600 text-white font-semibold' : 'text-gray-500 hover:bg-gray-100',
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="pt-6 border-t border-gray-200 space-y-1">
        <Link
          href="/"
          onClick={onNavigate}
          className="w-full flex items-center gap-3 px-4 py-3 text-blue-600 border border-blue-200 rounded-xl mb-3 hover:bg-blue-50 transition-all text-sm font-medium"
        >
          <ArrowLeftRight className="w-5 h-5" />
          Switch to Guest
        </Link>
        <Link
          href="/support"
          onClick={onNavigate}
          className="flex items-center gap-3 px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-all text-sm"
        >
          <LifeBuoy className="w-5 h-5" />
          Support
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-all text-sm"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </>
  );
}

export default function HostDashboardShell({
  active,
  children,
}: {
  active: NavKey;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, signOut } = useAuth();
  const handleLogout = () => signOut();
  const avatar = user?.profile_pic_url || 'https://i.pravatar.cc/100?img=12';

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-800 lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col h-screen fixed left-0 top-0 py-8 px-4 border-r border-gray-200 bg-white w-64 z-40">
        <SidebarContent active={active} onLogout={handleLogout} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85%] bg-white flex flex-col py-8 px-4 shadow-2xl animate-slide-up">
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="absolute top-4 right-4 p-2 text-gray-500 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent
              active={active}
              onLogout={handleLogout}
              onNavigate={() => setDrawerOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Top bar */}
      <header className="sticky top-0 z-30 flex justify-between items-center px-4 md:px-10 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200">
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

      <main className="px-4 sm:px-6 md:px-10 py-8 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}

// Page heading used across dashboard pages.
export function DashboardHeading({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-base text-gray-500 mt-2 max-w-2xl">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </section>
  );
}
