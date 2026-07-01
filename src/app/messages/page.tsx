'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function MessagesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
            <MessageCircle className="w-10 h-10 text-blue-600" />
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">No messages yet</h1>

          {/* Body */}
          <p className="text-gray-500 max-w-sm text-base leading-relaxed mb-8">
            Ready to start a conversation? Once you message a host or receive a booking
            confirmation, your chats will appear here.
          </p>

          {/* CTA */}
          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl transition-colors"
          >
            Explore Properties
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
