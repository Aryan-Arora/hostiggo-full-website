'use client';

import Link from 'next/link';
import {
  LayoutDashboard,
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
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NavKey =
  | 'overview'
  | 'bookings'
  | 'listings'
  | 'calendar'
  | 'earnings'
  | 'reviews'
  | 'settings';

const NAV: { key: NavKey; label: string; href: string; icon: LucideIcon }[] = [
  { key: 'overview', label: 'Overview', href: '/host/listings', icon: LayoutDashboard },
  { key: 'bookings', label: 'Reservations', href: '/host/bookings', icon: CalendarCheck },
  { key: 'listings', label: 'Properties', href: '/host/listings', icon: Building2 },
  { key: 'calendar', label: 'Calendar', href: '/host/calendar', icon: CalendarDays },
  { key: 'earnings', label: 'Earnings', href: '/host/earnings', icon: Wallet },
  { key: 'reviews', label: 'Reviews', href: '/host/reviews', icon: Star },
  { key: 'settings', label: 'Settings', href: '/host/settings', icon: Settings },
];

export default function HostDashboardShell({
  active,
  children,
}: {
  active: NavKey;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-800 lg:pl-64 pb-20 lg:pb-0">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col h-screen fixed left-0 top-0 py-8 px-4 border-r border-gray-200 bg-white w-64 z-40">
        <div className="mb-10 px-2">
          <Link href="/" className="text-lg font-extrabold text-gray-900">
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
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium',
                  on
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-gray-500 hover:bg-gray-100',
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
            className="w-full flex items-center gap-3 px-4 py-3 text-blue-600 border border-blue-200 rounded-xl mb-3 hover:bg-blue-50 transition-all text-sm font-medium"
          >
            <ArrowLeftRight className="w-5 h-5" />
            Switch to Guest
          </Link>
          <Link
            href="/support"
            className="flex items-center gap-3 px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-all text-sm"
          >
            <LifeBuoy className="w-5 h-5" />
            Support
          </Link>
          <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-all text-sm">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-30 flex justify-between items-center px-6 md:px-10 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="lg:hidden">
          <Link href="/" className="text-lg font-extrabold text-gray-900">
            HOSTI<span className="text-blue-600">GGO</span>
          </Link>
        </div>
        <div className="hidden lg:block" />
        <div className="flex items-center gap-3">
          <Link
            href="/host/list/property-type"
            className="hidden sm:flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-blue-700 transition-all active:scale-[0.99]"
          >
            <Plus className="w-5 h-5" />
            Create Listing
          </Link>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all">
            <HelpCircle className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden ml-1 border border-gray-200">
            <img
              src="https://i.pravatar.cc/100?img=12"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>

      <main className="px-6 md:px-10 py-8 max-w-7xl mx-auto">{children}</main>
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
