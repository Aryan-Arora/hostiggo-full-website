'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// A real user row from the DB — used only as a dev shortcut so the host area
// is reviewable locally (production sign-in is phone OTP). Never shown in prod.
const DEMO_HOST_ID = 'a1e587bc-0fc9-454e-90c8-bc0d22ee5330';
const IS_DEV = process.env.NODE_ENV !== 'production';

export default function HostLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, signIn } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-card border border-gray-200 max-w-md w-full p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-5">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Sign in to manage your hosting
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Your listings, bookings, and earnings live here. Sign in to continue.
          </p>
          <Link
            href="/signin"
            className="block w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-all"
          >
            Sign in
          </Link>
          {IS_DEV && (
            <button
              onClick={async () => {
                await signIn(DEMO_HOST_ID);
                router.refresh();
              }}
              className="mt-3 w-full border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-all"
            >
              Continue as demo host (dev)
            </button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
