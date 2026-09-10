"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  Check,
  Clock,
  Globe,
  Heart,
  HelpCircle,
  Home,
  IndianRupee,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  Star,
  User,
  X,
} from "lucide-react";

// Signed-in user display fallback -- must match the placeholder used in
// account/profile/page.tsx so an unset profile photo looks the same
// everywhere instead of showing a different random face per page.
const USER = {
  name: "Account",
  avatar: "https://i.pravatar.cc/200?img=45",
};

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  to?: string;
  danger?: boolean;
  action?: () => void;
  // Placeholder for a feature that isn't built yet, rendered disabled with a
  // "Soon" pill so the slot stays in the menu without being a dead link.
  soon?: boolean;
}

const MENU_GROUPS: MenuItem[][] = [
  [
    {
      icon: <MessageCircle className="w-4 h-4" />,
      label: "Chats",
      to: "/chat",
    },
    {
      icon: <Heart className="w-4 h-4" />,
      label: "Wishlists",
      to: "/wishlist",
    },
    {
      icon: <Clock className="w-4 h-4" />,
      label: "Memories",
      to: "/my-memories",
    },
    {
      icon: <User className="w-4 h-4" />,
      label: "Profile",
      to: "/account/profile",
    },
  ],
  [
    {
      icon: <Settings className="w-4 h-4" />,
      label: "Account Settings",
      to: "/account/settings",
    },
    {
      icon: <Star className="w-4 h-4" />,
      label: "My reviews",
      to: "/host/reviews",
    },
    {
      icon: <HelpCircle className="w-4 h-4" />,
      label: "Customer support",
      to: "/support",
    },
  ],
];

interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

const CURRENCIES: CurrencyOption[] = [
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "USD", name: "United States Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "AED", name: "United Arab Emirates Dirham", symbol: "د.إ" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
];

interface LanguageOption {
  code: string;
  name: string;
  nativeName?: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English (US)" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "zh", name: "Chinese", nativeName: "简体中文" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'currency' | 'language' | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState("INR");
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const profileRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
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
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close currency/language dropdown on outside click or Escape
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setActiveDropdown(null);
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, []);

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-50 shadow-[0_8px_30px_rgba(59,130,246,0.12)] flex-shrink-0">
      <div className="w-full px-4 sm:px-6 lg:px-10">
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
              <span
                className="font-semibold text-[#374151] text-[21px] leading-[140%] uppercase tracking-normal"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Hostig
              </span>
              <span
                className="font-semibold text-[#0086D8] text-[21px] leading-[140%] uppercase tracking-normal"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                go
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {/* Currency & Language Selectors */}
            <div ref={dropdownRef} className="flex items-center gap-1">
              {/* Currency Dropdown Trigger & Panel */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    setActiveDropdown((prev) => (prev === "currency" ? null : "currency"));
                  }}
                  className={cn(
                    "flex items-center gap-1 text-figma-ink hover:text-black hover:bg-gray-50 px-3 py-1.5 text-[14px] font-medium rounded-lg transition-colors cursor-pointer",
                    activeDropdown === "currency" && "bg-gray-100 text-black"
                  )}
                  aria-label="Select currency"
                  aria-expanded={activeDropdown === "currency"}
                >
                  {selectedCurrency === "INR" ? (
                    <IndianRupee className="w-3.5 h-3.5" strokeWidth={2} />
                  ) : (
                    <span className="text-[13px] font-semibold">
                      {CURRENCIES.find((c) => c.code === selectedCurrency)?.symbol || ""}
                    </span>
                  )}
                  <span>{selectedCurrency}.</span>
                </button>

                {activeDropdown === "currency" && (
                  <div
                    className="absolute top-[calc(100%+8px)] left-0 w-[323px] h-[535px] rounded-[6px] shadow-[0_4px_21.7px_6px_rgba(0,0,0,0.25)] bg-white z-50 overflow-y-auto divide-y divide-gray-100 py-1"
                    style={{ animation: "fadeInDown 0.18s ease both" }}
                  >
                    {CURRENCIES.map((curr) => {
                      const isSelected = selectedCurrency === curr.code;
                      return (
                        <button
                          key={curr.code}
                          type="button"
                          onClick={() => {
                            setSelectedCurrency(curr.code);
                            setActiveDropdown(null);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50 cursor-pointer",
                            isSelected && "bg-blue-50/40"
                          )}
                        >
                          <div className="flex flex-col pr-2">
                            <span
                              className={cn(
                                "text-[14px] leading-tight",
                                isSelected
                                  ? "font-semibold text-figma-navy"
                                  : "font-medium text-[#222222]"
                              )}
                            >
                              {curr.name}
                            </span>
                            <span className="text-[12px] text-gray-500 mt-0.5">
                              {curr.code} &middot; {curr.symbol}
                            </span>
                          </div>
                          {isSelected && (
                            <Check
                              className="w-4 h-4 text-figma-navy shrink-0 ml-auto"
                              strokeWidth={2.5}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <span className="h-4 w-px bg-gray-200 mx-0.5" />

              {/* Language Dropdown Trigger & Panel */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    setActiveDropdown((prev) => (prev === "language" ? null : "language"));
                  }}
                  className={cn(
                    "flex items-center gap-1.5 text-figma-ink hover:text-black hover:bg-gray-50 px-3 py-1.5 text-[14px] font-medium rounded-lg transition-colors cursor-pointer",
                    activeDropdown === "language" && "bg-gray-100 text-black"
                  )}
                  aria-label="Select language"
                  aria-expanded={activeDropdown === "language"}
                >
                  <Globe className="w-3.5 h-3.5" strokeWidth={1.8} />
                  <span>{selectedLanguage}</span>
                </button>

                {activeDropdown === "language" && (
                  <div
                    className="absolute top-[calc(100%+8px)] left-0 w-[323px] h-[535px] rounded-[6px] shadow-[0_4px_21.7px_6px_rgba(0,0,0,0.25)] bg-white z-50 overflow-y-auto divide-y divide-gray-100 py-1"
                    style={{ animation: "fadeInDown 0.18s ease both" }}
                  >
                    {LANGUAGES.map((lang) => {
                      const isSelected = selectedLanguage === lang.name;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            setSelectedLanguage(lang.name);
                            setActiveDropdown(null);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50 cursor-pointer",
                            isSelected && "bg-blue-50/40"
                          )}
                        >
                          <div className="flex flex-col pr-2">
                            <span
                              className={cn(
                                "text-[14px] leading-tight",
                                isSelected
                                  ? "font-semibold text-figma-navy"
                                  : "font-medium text-[#222222]"
                              )}
                            >
                              {lang.name}
                            </span>
                            {lang.nativeName && lang.nativeName !== lang.name && (
                              <span className="text-[12px] text-gray-500 mt-0.5">
                                {lang.nativeName}
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <Check
                              className="w-4 h-4 text-figma-navy shrink-0 ml-auto"
                              strokeWidth={2.5}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <span className="h-4 w-px bg-gray-200 mx-0.5" />

            {isAuthenticated ? (
              <>
                <button
                  className="border border-figma-navy text-figma-navy hover:bg-figma-navy/5 px-4 py-2 rounded-xl text-[14px] font-medium transition-colors ml-1"
                  onClick={() => router.push("/host/list/method")}
                >
                  List your property
                </button>

                {/* Avatar + Dropdown */}
                <div ref={profileRef} className="relative ml-2">
                  <button
                    onClick={() => setProfileOpen((v) => !v)}
                    className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-offset-1 ring-transparent hover:ring-figma-accent transition-all"
                  >
                    <Image
                      width={36}
                      height={36}
                      src={user?.profile_pic_url || USER.avatar}
                      alt={user?.name || USER.name}
                      className="w-full h-full object-cover"
                    />
                  </button>

                  {/* Dropdown */}
                  {profileOpen && (
                    <div
                      className={cn(
                        "absolute right-0 top-[calc(100%+8px)] w-[260px] h-auto max-h-[80vh] overflow-y-auto bg-white rounded-[6px] p-[9px] shadow-[0_4px_21.7px_6px_rgba(0,0,0,0.25)] border border-gray-100 z-50 flex flex-col",
                        "animate-fade-in-down origin-top-right",
                      )}
                      style={{ animation: "fadeInDown 0.18s ease both" }}
                    >
                      <div className="flex flex-col">
                        {MENU_GROUPS.map((group, gi) => (
                          <div key={gi}>
                            <div className="py-0.5">
                              {group.map((item) =>
                                item.soon ? (
                                  <div
                                    key={item.label}
                                    aria-disabled="true"
                                    title="Coming soon"
                                    className="flex items-center gap-2.5 px-2.5 py-1.5 text-[14px] font-medium text-gray-400 cursor-default select-none"
                                  >
                                    <span className="text-gray-300">
                                      {item.icon}
                                    </span>
                                    <span>{item.label}</span>
                                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">
                                      Soon
                                    </span>
                                  </div>
                                ) : (
                                  <Link
                                    key={item.label}
                                    href={item.to ?? "#"}
                                    onClick={() => {
                                      item.action?.();
                                      setProfileOpen(false);
                                    }}
                                    className="flex items-center gap-2.5 px-2.5 py-1.5 text-[14px] font-medium text-gray-700 hover:bg-gray-50 rounded transition-colors"
                                  >
                                    <span className="text-gray-400">
                                      {item.icon}
                                    </span>
                                    <span>{item.label}</span>
                                  </Link>
                                ),
                              )}
                            </div>
                            {/* Dotted divider below each group */}
                            <div className="border-b border-dotted border-gray-300 my-1" />
                          </div>
                        ))}
                      </div>

                      {/* Promotional Placeholder Box */}
                      <div className="w-full h-[80px] bg-gray-300 rounded-md my-2" />

                      {/* Sign out */}
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full py-2 border border-red-500 text-red-500 font-medium rounded-md hover:bg-red-50 text-center flex justify-center transition-colors text-[14px]"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  className="text-figma-navy hover:bg-figma-navy/5 px-3 py-1.5 rounded-lg transition-colors text-[14px] font-medium ml-0.5"
                  onClick={() => router.push("/signin")}
                >
                  Sign In
                </button>
                <button
                  className="bg-figma-navy hover:bg-figma-navy/90 active:bg-figma-navy text-white px-4 py-2 rounded-xl text-[14px] font-medium transition-colors ml-1 shadow-sm"
                  onClick={() => router.push("/signin")}
                >
                  New user
                </button>
                <button
                  onClick={() => router.push("/host/list/method")}
                  className="border border-figma-navy text-figma-navy hover:bg-figma-navy/5 px-4 py-2 rounded-xl text-[14px] font-medium transition-colors ml-1"
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
              {selectedCurrency === "INR" ? (
                <IndianRupee className="w-4 h-4 text-gray-500" />
              ) : (
                <span className="text-[13px] font-semibold text-gray-500">
                  {CURRENCIES.find((c) => c.code === selectedCurrency)?.symbol || ""}
                </span>
              )}
              {selectedCurrency}
            </div>
            <div className="w-full px-4 py-2.5 text-sm text-gray-500 flex items-center gap-2.5 font-medium">
              <Globe className="w-4 h-4 text-gray-500" /> {selectedLanguage}
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
                    router.push("/signin");
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl font-medium"
                >
                  Sign in
                </button>
                <div className="px-4 pt-2 flex gap-2">
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      router.push("/signin");
                    }}
                    className="flex-1 bg-figma-navy text-white py-2 rounded-xl text-sm font-semibold"
                  >
                    New user
                  </button>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      router.push("/host/list/method");
                    }}
                    className="flex-1 border border-figma-navy text-figma-navy py-2 rounded-xl text-sm font-semibold"
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
