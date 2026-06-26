import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Globe,
  ChevronDown,
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
  Search,
  Check,
  Gift,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
];

// Signed-in user display (avatar only until profile fetch is wired).
const USER = {
  name: 'Account',
  avatar: 'https://i.pravatar.cc/150?img=11',
};

function CurrencyDropdown() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(CURRENCIES[0]);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          setOpen((v) => !v);
          setSearch('');
        }}
        className="flex items-center gap-1 text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-[13px] font-medium"
      >
        <IndianRupee className="w-3.5 h-3.5" strokeWidth={2} />
        <span>{selected.code}.</span>
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] w-[220px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in-down">
          {/* Search */}
          <div className="px-3 pt-3 pb-2">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/10 transition-all">
              <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-[13px] text-gray-700 placeholder:text-gray-400 outline-none"
              />
            </div>
          </div>

          {/* Currency list */}
          <div className="max-h-[240px] overflow-y-auto scrollbar-hide pb-2">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-[12px] text-gray-400 text-center">
                No currencies found
              </p>
            ) : (
              filtered.map((cur) => (
                <button
                  key={cur.code}
                  onClick={() => {
                    setSelected(cur);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-2.5 text-[13px] transition-colors',
                    cur.code === selected.code
                      ? 'text-blue-600 font-semibold bg-blue-50/50'
                      : 'text-gray-700 hover:bg-gray-50',
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-5 text-center text-[14px] font-semibold text-gray-500">
                      {cur.symbol}
                    </span>
                    <span>{cur.code}</span>
                  </span>
                  {cur.code === selected.code && (
                    <Check
                      className="w-4 h-4 text-blue-600"
                      strokeWidth={2.5}
                    />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
    { icon: <MessageCircle className="w-4 h-4" />, label: 'Chats', soon: true },
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
            <div className="w-9 h-9 bg-[#004772] rounded-full flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
              <span className="text-white font-bold text-[18px] leading-none">
                H
              </span>
            </div>
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
            <CurrencyDropdown />
            <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-[13px] font-medium">
              <Globe className="w-3.5 h-3.5" strokeWidth={1.8} />
              <span>English</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {isAuthenticated ? (
              <>
                <button
                  className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-colors ml-1"
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
                  className="bg-[#005a9c] hover:bg-[#004a80] active:bg-[#003a66] text-white px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-colors ml-1 shadow-sm"
                  onClick={() => router.push('/signin')}
                >
                  New user
                </button>
                <button
                  onClick={() => router.push('/host/list/property-type')}
                  className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-colors ml-1"
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
            <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl flex items-center gap-2.5 font-medium">
              <IndianRupee className="w-4 h-4 text-gray-500" /> INR
            </button>
            <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl flex items-center gap-2.5 font-medium">
              <Globe className="w-4 h-4 text-gray-500" /> English
            </button>
            {isAuthenticated ? (
              <>
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
