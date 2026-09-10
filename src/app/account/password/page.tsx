"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, Key, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import { api, getStoredAccessToken } from "@/lib/api";

function PasswordSecurityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // Arriving here straight from OTP verification (new email creating its
  // first password, or an existing user who forgot theirs) rather than as
  // a normal settings visit -- see /otp's `next` handling and the sign-in
  // page's password flow.
  const isFirstTime = searchParams?.get("first") === "1";
  const reason = searchParams?.get("reason"); // 'create-password' | 'reset-password'
  const next = searchParams?.get("next");

  // Phone-OTP-only accounts never establish a Supabase client session (see
  // AuthContext), so there's no bearer token to prove identity with here --
  // same limitation as every other bearer-token-gated route in this app.
  const hasSession = !!getStoredAccessToken();

  const handleSubmit = async () => {
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setSaving(true);
    try {
      await api.changePassword(password);
      toast.success(isFirstTime ? "Password created!" : "Password updated.");
      setPassword("");
      setConfirm("");
      if (isFirstTime) {
        router.push(next || "/");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update your password.");
    } finally {
      setSaving(false);
    }
  };

  const heading = isFirstTime
    ? reason === "reset-password"
      ? "Set a new password"
      : "Create a password"
    : "Password & Security";
  const subheading = isFirstTime
    ? reason === "reset-password"
      ? "Your identity is confirmed. Choose a new password to sign in with."
      : "You're verified — choose a password so you can sign in directly next time."
    : "Set or change the password used to sign in with your email.";

  return (
    <div className="min-h-screen bg-figma-cream flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex items-center gap-4 sm:gap-6 mb-10">
          {!isFirstTime && (
            <Link
              href="/account/settings"
              className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors shadow-sm shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          <div>
            <h1 className="text-[28px] sm:text-[32px] font-extrabold text-gray-900 tracking-tight mb-1">
              {heading}
            </h1>
            <p className="text-[15px] text-gray-500">{subheading}</p>
          </div>
        </div>

        {authLoading ? (
          <div className="py-24 flex justify-center text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : !isAuthenticated ? (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-card py-16 text-center">
            <p className="text-4xl mb-3">🔒</p>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Sign in to manage this</h2>
          </div>
        ) : !hasSession ? (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-card p-8 text-center">
            <p className="text-sm text-gray-600">
              Password management isn&apos;t available for accounts signed in with
              mobile OTP only. Sign in with email or Google first, then come back
              here.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-card p-6 sm:p-8">
            {!isFirstTime && (
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-figma-navy/5 text-figma-navy flex items-center justify-center shrink-0">
                  <Key className="w-5 h-5" />
                </div>
                <p className="text-sm text-gray-600">
                  This also lets you sign in with a password from now on, even if you
                  originally signed up with an OTP or Google.
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                  New password
                </label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl overflow-hidden focus-within:border-figma-navy focus-within:ring-2 focus-within:ring-figma-navy/10 transition-all">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex-1 pl-4 pr-2 py-3 text-[14px] text-gray-800 outline-none bg-white placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="mr-3 text-gray-400 hover:text-gray-600 flex-shrink-0"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                  Confirm new password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-figma-navy focus:border-transparent outline-none text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              {isFirstTime && (
                <button
                  onClick={() => router.push(next || "/")}
                  className="px-5 py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Skip for now
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-8 py-3 bg-figma-navy text-white rounded-xl font-bold hover:bg-figma-navy/90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Saving…" : isFirstTime ? "Create password" : "Update password"}
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function PasswordSecurityPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-figma-cream" />}>
      <PasswordSecurityContent />
    </Suspense>
  );
}
