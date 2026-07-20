'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/components/providers/AuthProvider';
import {
  Globe,
  IndianRupee,
  Menu,
  X,
  MessageCircle,
  Heart,
  Clock,
  User,
  Settings,
  Star,
  HelpCircle,
  Home,
  LogOut,
  Gift,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

// Signed-in user display fallback -- must match the placeholder used in
// account/profile/page.tsx so an unset profile photo looks the same
// everywhere instead of showing a different random face per page.
const USER = {
  name: 'Account',
  avatar: 'https://i.pravatar.cc/200?img=45',
};

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  to?: string;
  danger?: boolean;
  action?: () => void;
  // Placeholder for a feature that isn't built yet — rendered disabled with a
  // "Soon" pill so the slot stays in the menu without being a dead link.
  soon?: boolean;
}

const MENU_GROUPS: MenuItem[][] = [
  [
    { icon: <MessageCircle className="w-4 h-4" />, label: 'Chats', to: '/chat' },
    {
      icon: <Heart className="w-4 h-4" />,
      label: 'Wishlists',
      to: '/wishlist',
    },
    {
      icon: <Clock className="w-4 h-4" />,
      label: 'Memories',
      to: '/my-memories',
    },
    { icon: <User className="w-4 h-4" />, label: 'Profile', to: '/account/profile' },
  ],
  [
    {
      icon: <Settings className="w-4 h-4" />,
      label: 'Account Settings',
      to: '/account/settings',
    },
    { icon: <Star className="w-4 h-4" />, label: 'My reviews', to: '/host/reviews' },
    {
      icon: <Gift className="w-4 h-4" />,
      label: 'Refer & earn',
      to: '/refer',
    },
    {
      icon: <HelpCircle className="w-4 h-4" />,
      label: 'Customer support',
      to: '/support',
    },
  ],
  [
    {
      icon: <Home className="w-4 h-4 text-amber-500" />,
      label: 'Host & Earn',
      to: '/host/listings',
    },
  ],
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { isAuthenticated, user, signOut } = useAuth();

  const handleSignOut = () => {
    setProfileOpen(false);
    setMobileOpen(false);
    signOut();
  };

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-50 shadow-[0_8px_30px_rgba(59,130,246,0.12)] flex-shrink-0">
      <div className="container-main">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 flex-shrink-0 group"
          >
            <Image
              src="/logo.png"
              alt="Hostiggo Logo"
              width={36}
              height={36}
              className="transition-transform group-hover:scale-105"
            />
            <div className="flex items-baseline">
              <span className="font-black text-[#374151] text-[17px] tracking-wider uppercase">
                Hosti
              </span>
              <span className="font-black text-[#0086D8] text-[17px] tracking-wider uppercase">
                ggo
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            <span className="flex items-center gap-1 text-gray-500 px-3 py-1.5 text-[13px] font-medium">
              <IndianRupee className="w-3.5 h-3.5" strokeWidth={2} />
              INR
            </span>
            <span className="flex items-center gap-1 text-gray-500 px-3 py-1.5 text-[13px] font-medium">
              <Globe className="w-3.5 h-3.5" strokeWidth={1.8} />
              English
            </span>

            {isAuthenticated ? (
              <>
                <button
                  className="border border-figma-navy text-figma-navy hover:bg-figma-navy/5 px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-colors ml-1"
                  onClick={() => router.push('/host/list/property-type')}
                >
                  List your property
                </button>

                {/* Avatar + Dropdown */}
                <div ref={profileRef} className="relative ml-2">
                  <button
                    onClick={() => setProfileOpen((v) => !v)}
                    className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-offset-1 ring-transparent hover:ring-blue-400 transition-all"
                  >
                    <img
                      src={user?.profile_pic_url || USER.avatar}
                      alt={user?.name || USER.name}
                      className="w-full h-full object-cover"
                    />
                  </button>

                  {/* Dropdown */}
                  {profileOpen && (
                    <div
                      className={cn(
                        'absolute right-0 top-[calc(100%+10px)] w-[220px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden',
                        'animate-fade-in-down origin-top-right',
                      )}
                      style={{ animation: 'fadeInDown 0.18s ease both' }}
                    >
                      {MENU_GROUPS.map((group, gi) => (
                        <div key={gi}>
                          {gi > 0 && <div className="h-px bg-gray-100 mx-3" />}
                          <div className="py-1.5">
                            {group.map((item) =>
                              item.soon ? (
                                <div
                                  key={item.label}
                                  aria-disabled="true"
                                  title="Coming soon"
                                  className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-gray-400 cursor-default select-none"
                                >
                                  <span className="text-gray-300">{item.icon}</span>
                                  <span>{item.label}</span>
                                  <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">
                                    Soon
                                  </span>
                                </div>
                              ) : (
                                <Link
                                  key={item.label}
                                  href={item.to ?? '#'}
                                  onClick={() => {
                                    item.action?.();
                                    setProfileOpen(false);
                                  }}
                                  className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <span className="text-gray-400">{item.icon}</span>
                                  <span>{item.label}</span>
                                </Link>
                              ),
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Sign out */}
                      <div className="h-px bg-gray-100 mx-3" />
                      <div className="p-3">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  className="text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-[13px] font-medium ml-1"
                  onClick={() => router.push('/signin')}
                >
                  Sign in
                </button>
                <button
                  className="bg-figma-navy hover:bg-figma-navy/90 active:bg-figma-navy text-white px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-colors ml-1 shadow-sm"
                  onClick={() => router.push('/signin')}
                >
                  New user
                </button>
                <button
                  onClick={() => router.push('/host/list/property-type')}
                  className="border border-figma-navy text-figma-navy hover:bg-figma-navy/5 px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-colors ml-1"
                >
                  List your property
                </button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1 pb-4">
            <div className="w-full px-4 py-2.5 text-sm text-gray-500 flex items-center gap-2.5 font-medium">
              <IndianRupee className="w-4 h-4 text-gray-500" /> INR
            </div>
            <div className="w-full px-4 py-2.5 text-sm text-gray-500 flex items-center gap-2.5 font-medium">
              <Globe className="w-4 h-4 text-gray-500" /> English
            </div>
            {isAuthenticated ? (
              <>
                <Link
                  href="/chat"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl flex items-center gap-2.5 font-medium"
                >
                  <MessageCircle className="w-4 h-4 text-gray-500" /> Chats
                </Link>
                <Link
                  href="/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl flex items-center gap-2.5 font-medium"
                >
                  <Heart className="w-4 h-4 text-gray-500" /> Wishlists
                </Link>
                <Link
                  href="/account/profile"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl flex items-center gap-2.5 font-medium"
                >
                  <User className="w-4 h-4 text-gray-500" /> Profile
                </Link>
                <Link
                  href="/host/listings"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl flex items-center gap-2.5 font-medium"
                >
                  <Home className="w-4 h-4 text-amber-500" /> Host &amp; Earn
                </Link>
                <div className="px-4 pt-2">
                  <button
                    onClick={handleSignOut}
                    className="w-full border border-red-200 text-red-500 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    router.push('/signin');
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl font-medium"
                >
                  Sign in
                </button>
                <div className="px-4 pt-2 flex gap-2">
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      router.push('/signin');
                    }}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm font-semibold"
                  >
                    New user
                  </button>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      router.push('/host/list/property-type');
                    }}
                    className="flex-1 border border-blue-600 text-blue-600 py-2 rounded-xl text-sm font-semibold"
                  >
                    List property
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
