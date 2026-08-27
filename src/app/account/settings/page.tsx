"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  User,
  Mail,
  Activity,
  ShieldCheck,
  Key,
  MessageSquare,
  Megaphone,
  Globe,
  DollarSign,
  AlertTriangle,
  ChevronRight,
  Trash2,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';

interface SettingItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
}

interface SettingCategory {
  title: string;
  items: SettingItem[];
}

const SETTING_CATEGORIES: SettingCategory[] = [
  {
    title: 'Account Settings',
    items: [
      { id: 'personal-info', label: 'Personal information', icon: User, href: '/account/profile' },
      { id: 'email-phone', label: 'Email & Phone no', icon: Mail, href: '/account/profile' },
      { id: 'login-activity', label: 'Login activity', icon: Activity },
      { id: 'profile-verification', label: 'Profile verification', icon: ShieldCheck },
      { id: 'password-security', label: 'Password & Security', icon: Key },
    ],
  },
  {
    title: 'Notifications',
    items: [
      { id: 'message-notifications', label: 'Message notifications', icon: MessageSquare },
      { id: 'promotional-emails', label: 'Promotional emails', icon: Megaphone },
    ],
  },
  {
    title: 'App preferences',
    items: [
      { id: 'language', label: 'Language', icon: Globe },
      { id: 'currency', label: 'Currency', icon: DollarSign },
    ],
  },
  {
    title: 'Privacy & Security',
    items: [
      { id: 'reported-issues', label: 'Reported issues', icon: AlertTriangle },
    ],
  },
];

function SettingPill({ item }: { item: SettingItem }) {
  const Icon = item.icon;

  const content = (
    <>
      <Icon className="w-5 h-5 text-gray-500 shrink-0 group-hover:text-gray-700 transition-colors" />
      <span className="text-gray-900 font-medium text-sm sm:text-[15px] truncate">
        {item.label}
      </span>
      <ChevronRight className="w-4 h-4 text-gray-400 ml-auto shrink-0 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
    </>
  );

  const pillClasses =
    'flex items-center gap-3.5 w-full px-5 py-4 bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-gray-300 transition-all duration-200 text-left group cursor-pointer';

  if (item.href) {
    return (
      <Link href={item.href} className={pillClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toast.info(`${item.label} settings coming soon`)}
      className={pillClasses}
    >
      {content}
    </button>
  );
}

export default function GuestSettingsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(false);
    toast.error('Account deletion request received. Please contact support to complete this request.');
  };

  return (
    <div className="min-h-screen bg-figma-cream flex flex-col">
      <Navbar />

      <main className="container-main max-w-4xl py-10 flex-1 w-full">
        {/* Header with Circular Back Button & Large Title */}
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow transition-all flex items-center justify-center text-gray-700 hover:text-gray-900 shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">My Settings</h1>
        </div>

        {authLoading ? (
          <div className="py-24 flex justify-center text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : !isAuthenticated ? (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-card py-16 text-center max-w-md mx-auto">
            <p className="text-4xl mb-3">🔒</p>
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              Sign in to view your settings
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Manage your preferences once you&apos;re signed in.
            </p>
            <Link
              href="/signin?redirect=/account/settings"
              className="inline-flex items-center gap-2 bg-figma-navy text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-figma-navy/90"
            >
              Sign in
            </Link>
          </div>
        ) : (
          <div>
            {/* Single main column layout with subtle vertical gray line connecting the sections */}
            <div className="border-l-2 border-gray-100 ml-4 pl-6 space-y-8">
              {SETTING_CATEGORIES.map((category) => (
                <section key={category.title}>
                  <h2 className="text-gray-500 font-medium text-[15px] mb-4">
                    {category.title}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {category.items.map((item) => (
                      <SettingPill key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* Dotted horizontal separator at the bottom of the sections */}
            <div className="border-t border-dashed border-gray-300 my-8 w-full" />

            {/* Centered Delete Account Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center justify-center gap-2.5 bg-red-50 hover:bg-red-100 text-red-500 font-semibold px-10 py-3 rounded-xl border border-red-200/70 shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-500 shrink-0" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-center animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Account?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete your account? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors text-sm shadow-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
