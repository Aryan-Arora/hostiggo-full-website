'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-figma-cream flex flex-col items-center justify-center px-4">
      <div className="text-7xl mb-6">🏨</div>
      <h1 className="text-4xl font-extrabold text-gray-800 mb-2">404</h1>
      <p className="text-gray-500 text-lg mb-6 text-center">
        Oops! This page checked out and never came back.
      </p>
      <Link
        href="/"
        className="flex items-center gap-2 bg-figma-navy hover:bg-figma-navy/90 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-md"
      >
        <Home className="w-4 h-4" />
        Back to Home
      </Link>
    </div>
  );
}
