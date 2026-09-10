'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, RotateCw } from 'lucide-react';

// App Router convention: catches any uncaught error thrown during render
// anywhere under this segment and shows this instead of the framework's
// bare default page. There was no error.tsx anywhere in this app before --
// e.g. a bad Google Maps API key crashing InteractiveMap took the entire
// search results page down to Next's generic, unstyled "Something went
// wrong!" with no way back except a manual URL change. That specific crash
// is now caught locally (see InteractiveMap's onError/GuestMapSearch's
// mapUnavailable fallback) so it never reaches this boundary at all -- this
// is the app-wide net for whatever the next uncaught one turns out to be.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app/error] uncaught render error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-figma-cream flex flex-col items-center justify-center px-4">
      <div className="text-7xl mb-6">🧭</div>
      <h1 className="text-2xl font-extrabold text-gray-800 mb-2 text-center">
        Something went wrong
      </h1>
      <p className="text-gray-500 text-base mb-6 text-center max-w-sm">
        This page hit an unexpected error. Try again, or head back home --
        the rest of Hostiggo is unaffected.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2 bg-figma-navy hover:bg-figma-navy/90 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-md"
        >
          <RotateCw className="w-4 h-4" />
          Try again
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
