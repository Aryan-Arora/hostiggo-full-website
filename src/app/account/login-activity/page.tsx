"use client";

import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function LoginActivityPage() {
  return (
    <div className="min-h-screen bg-figma-cream flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-12">
          <Link
            href="/account/settings"
            className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors shadow-sm shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-[28px] sm:text-[32px] font-extrabold text-gray-900 tracking-tight mb-2">
              Login activity
            </h1>
            <p className="text-[15px] text-gray-500 max-w-2xl leading-relaxed">
              Review recent sign-ins to your account. If you notice any activity
              you don&apos;t recognize, secure your account immediately.
            </p>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto mt-16 sm:mt-24">
          <div className="mb-8 relative w-48 h-48 sm:w-64 sm:h-64">
            <Image
              src="/images/empty-states/yeti-back.png"
              alt="No recent activity to show"
              fill
              className="object-contain drop-shadow-md animate-floating"
            />
          </div>
          <h2 className="text-[22px] sm:text-[26px] font-bold text-gray-900 leading-snug">
            No recent activity to show
          </h2>
        </div>
      </main>

      <Footer />
    </div>
  );
}
