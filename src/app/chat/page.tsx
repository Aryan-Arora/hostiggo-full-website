'use client';

import Link from 'next/link';
import { MessageCircle, ArrowLeft } from 'lucide-react';

export default function UserChatPage() {
  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Messages</h1>
              <p className="text-xs text-gray-500">Chat with your hosts</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-8">
        <div className="bg-white rounded-3xl p-8 shadow-card border border-gray-200 text-center">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No messages yet</p>
          <p className="text-sm text-gray-400 mt-1">Your messages with hosts will appear here</p>
        </div>
      </main>
    </div>
  );
}
