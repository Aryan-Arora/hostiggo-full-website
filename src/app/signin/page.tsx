"use client";

import {
  api,
  AUTH_EMAIL_KEY,
  AUTH_PHONE_KEY,
  normalizeEmail,
  normalizePhone,
  setStoredSession,
} from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, ChevronDown, Compass, Eye, EyeOff, Mail, Phone } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
const authBg = "/auth-bg.jpg";

type Mode = "phone" | "email" | "password";

function SignInContent() {
  // Phone OTP is the primary/default path -- password and email OTP are
  // still fully supported, just reached via the "instead" links below.
  const [mode, setMode] = useState<Mode>("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") || "";
  const { signIn } = useAuth();

  // Password mode -- separate from `email` (OTP) since it branches on
  // whether the email is already a Hostiggo account:
  //   'email'  -- ask for the email first, figure out which of the below applies
  //   'signin' -- known account: ask for their password
  // A brand-new email never gets a password form here at all -- it's sent
  // an OTP instead (see handlePwContinue), and only gets to set a password
  // after that OTP is verified (redirected to /account/password). Same for
  // "Forgot password?" on the signin step.
  type PwStep = "email" | "signin";
  const [pwStep, setPwStep] = useState<PwStep>("email");
  const [pwEmail, setPwEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [pwSubmitting, setPwSubmitting] = useState(false);

  const errorParam = searchParams?.get("error");

  useEffect(() => {
    if (!errorParam) return;
    toast.error(
      errorParam === "access_denied"
        ? "Sign-in was cancelled."
        : errorParam === "account_deactivated"
          ? "This account has been deactivated. Contact support to reactivate it."
          : errorParam === "no_oauth_response" || errorParam === "server_error"
            ? "Google sign-in didn't complete. Please try again."
            : `Sign-in error. Please try again.`,
    );
  }, [errorParam]);

  const handleSkip = () => router.push(redirect || "/");

  const handleSendOTP = async () => {
    if (sendingRef.current) return;
    if (mode === "phone" && phone.trim().length < 10) return;
    if (mode === "email" && !email.includes("@")) return;

    sendingRef.current = true;
    setSending(true);
    try {
      if (mode === "email") {
        const normalizedEmail = normalizeEmail(email);
        await api.sendEmailOtp(normalizedEmail);
        window.localStorage.setItem(AUTH_EMAIL_KEY, normalizedEmail);
        router.push(
          `/otp?mode=email&value=${encodeURIComponent(normalizedEmail)}${
            redirect ? `&redirect=${encodeURIComponent(redirect)}` : ""
          }`,
        );
      } else {
        const normalizedPhone = normalizePhone(phone);
        await api.sendOtp(normalizedPhone);
        window.localStorage.setItem(AUTH_PHONE_KEY, normalizedPhone);
        router.push(
          `/otp?mode=phone&value=${encodeURIComponent(normalizedPhone)}${
            redirect ? `&redirect=${encodeURIComponent(redirect)}` : ""
          }`,
        );
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to send OTP";
      if (
        msg.toLowerCase().includes("rate limit") ||
        msg.toLowerCase().includes("over") ||
        msg.toLowerCase().includes("too many")
      ) {
        toast.error("Please wait 60 seconds before requesting a new code");
      } else {
        toast.error(msg);
      }
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  // Step 1 of password mode: figure out whether this email already has an
  // account. New email -> verify they own the inbox via OTP first, then
  // they set a password on the other side (see /otp's `next` handling and
  // /account/password). Existing email -> just ask for the password.
  const handlePwContinue = async () => {
    if (!pwEmail.includes("@") || checkingEmail) return;
    setCheckingEmail(true);
    try {
      const normalizedEmail = normalizeEmail(pwEmail);
      const { exists } = await api.checkEmailExists(normalizedEmail);
      if (exists) {
        setPwStep("signin");
        return;
      }
      await api.sendEmailOtp(normalizedEmail);
      window.localStorage.setItem(AUTH_EMAIL_KEY, normalizedEmail);
      router.push(
        `/otp?mode=email&value=${encodeURIComponent(normalizedEmail)}&next=create-password${
          redirect ? `&redirect=${encodeURIComponent(redirect)}` : ""
        }`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setCheckingEmail(false);
    }
  };

  // Step 2 (existing account): actual password sign-in.
  const handlePasswordSignIn = async () => {
    if (password.length < 8) return;
    setPwSubmitting(true);
    try {
      const normalizedEmail = normalizeEmail(pwEmail);
      const result = await api.signInWithPassword(normalizedEmail, password);
      if (!result.session || !result.user) {
        toast.error("Could not sign in. Please try again.");
        return;
      }
      setStoredSession(result.session.access_token, result.session.refresh_token);
      await signIn(result.user.id);
      toast.success("Signed in!");
      router.push(redirect || "/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Incorrect email or password.");
    } finally {
      setPwSubmitting(false);
    }
  };

  // "Forgot password?" -- same OTP-then-set-password path as a new email,
  // just with different copy on the other side (reason=reset-password).
  const handleForgotPassword = async () => {
    if (!pwEmail.includes("@") || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    try {
      const normalizedEmail = normalizeEmail(pwEmail);
      await api.sendEmailOtp(normalizedEmail);
      window.localStorage.setItem(AUTH_EMAIL_KEY, normalizedEmail);
      router.push(
        `/otp?mode=email&value=${encodeURIComponent(normalizedEmail)}&next=reset-password${
          redirect ? `&redirect=${encodeURIComponent(redirect)}` : ""
        }`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send code");
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  // Google is the only social provider -- Supabase's signInWithOAuth handles
  // the redirect to Google's consent screen; the actual session gets
  // established back on /auth/callback once Google redirects here.
  const handleGoogleSignIn = async () => {
    try {
      // Keep redirectTo a bare, fixed URL. Supabase validates it against the
      // dashboard "Redirect URLs" allow list, and an allow-list entry for
      // ".../auth/callback" does NOT match ".../auth/callback?redirect=..."
      // unless a wildcard was added -- a mismatch silently drops the user on
      // the Site URL instead. Stash where to land after login in
      // sessionStorage; the callback page reads it back.
      if (redirect) {
        try {
          window.sessionStorage.setItem("hostiggo:post-auth-redirect", redirect);
        } catch {
          /* private mode / storage disabled -- fall back to default landing */
        }
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) {
        toast.error("Google sign-in failed. Please try again.");
      }
    } catch {
      toast.error("Google sign-in failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <Image
        fill
        priority
        src={authBg}
        alt="background"
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

      {/* Logo */}
      <div className="absolute top-6 left-8 z-10 flex items-center gap-2">
        <div className="w-8 h-8 bg-[#004772] rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-[16px]">H</span>
        </div>
        <span className="font-black text-white text-[16px] tracking-wider uppercase drop-shadow">
          HOSTI<span className="text-figma-accent">GGO</span>
        </span>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[360px] mx-4 bg-white rounded-3xl shadow-2xl p-8">
        {/* Back arrow -- phone OTP is the landing screen now, so no back
            arrow there; everything else backs up to it. */}
        {mode !== "phone" && (
          <button
            onClick={() => {
              if (mode === "password" && pwStep === "signin") {
                setPwStep("email");
              } else {
                setMode("phone");
              }
            }}
            className="mb-4 p-1 rounded-full hover:bg-gray-100 transition-colors inline-flex"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
        )}

        <h2
          className="text-[24px] font-normal text-gray-900 mb-1"
          style={{ fontFamily: "Andika New Basic, serif" }}
        >
          {mode === "phone"
            ? "Sign in with mobile no."
            : mode === "email"
              ? "Sign in with email"
              : pwStep === "email"
                ? "Sign in with a password"
                : "Enter your password"}
        </h2>
        <p className="text-[13px] text-gray-500 mb-6">
          {mode === "password" && pwStep === "signin"
            ? pwEmail
            : "Sign in to access personalized travel plans made for you"}
        </p>

        {/* Phone input */}
        {mode === "phone" && (
          <div className="flex items-center gap-0 border border-gray-200 rounded-xl overflow-hidden mb-4 focus-within:border-figma-navy focus-within:ring-2 focus-within:ring-figma-navy/10 transition-all">
            <div className="flex items-center gap-1 px-3 py-3 bg-gray-50 border-r border-gray-200 text-[14px] font-medium text-gray-700 cursor-pointer select-none">
              <span>+91</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <input
              type="tel"
              placeholder="Enter Mobile No."
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              className="flex-1 px-4 py-3 text-[14px] text-gray-800 outline-none bg-white placeholder:text-gray-400"
            />
          </div>
        )}

        {/* Email input */}
        {mode === "email" && (
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl overflow-hidden mb-4 focus-within:border-figma-navy focus-within:ring-2 focus-within:ring-figma-navy/10 transition-all">
            <Mail className="w-4 h-4 text-gray-400 ml-4 flex-shrink-0" />
            <input
              type="email"
              placeholder="Enter email id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-2 py-3 text-[14px] text-gray-800 outline-none bg-white placeholder:text-gray-400"
            />
          </div>
        )}

        {/* Password mode, step 1 -- just the email, to figure out whether
            this is an existing account (ask for password) or a new one
            (send an OTP, set a password after verifying it). */}
        {mode === "password" && pwStep === "email" && (
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl overflow-hidden mb-4 focus-within:border-figma-navy focus-within:ring-2 focus-within:ring-figma-navy/10 transition-all">
            <Mail className="w-4 h-4 text-gray-400 ml-4 flex-shrink-0" />
            <input
              type="email"
              placeholder="Enter email id"
              value={pwEmail}
              onChange={(e) => setPwEmail(e.target.value)}
              className="flex-1 px-2 py-3 text-[14px] text-gray-800 outline-none bg-white placeholder:text-gray-400"
            />
          </div>
        )}

        {/* Password mode, step 2 -- known account, just needs the password. */}
        {mode === "password" && pwStep === "signin" && (
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl overflow-hidden mb-2 focus-within:border-figma-navy focus-within:ring-2 focus-within:ring-figma-navy/10 transition-all">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              autoFocus
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
        )}
        {mode === "password" && pwStep === "signin" && (
          <p className="text-right mb-4">
            <button
              onClick={handleForgotPassword}
              disabled={sending}
              className="text-[12px] text-figma-navy hover:underline font-medium disabled:opacity-50"
            >
              {sending ? "Sending code..." : "Forgot password?"}
            </button>
          </p>
        )}

        {/* Send OTP / password submit button */}
        {mode === "password" && pwStep === "email" ? (
          <button
            onClick={handlePwContinue}
            disabled={checkingEmail}
            className="w-full py-3.5 bg-[#004772] hover:bg-[#003a5c] active:scale-[0.98] text-white font-normal rounded-xl transition-all text-[16px] shadow-sm mb-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#004772] disabled:active:scale-100"
            style={{ fontFamily: "Albert Sans, sans-serif" }}
          >
            {checkingEmail ? "Checking..." : "Continue"}
          </button>
        ) : mode === "password" && pwStep === "signin" ? (
          <button
            onClick={handlePasswordSignIn}
            disabled={pwSubmitting || password.length < 8}
            className="w-full py-3.5 bg-[#004772] hover:bg-[#003a5c] active:scale-[0.98] text-white font-normal rounded-xl transition-all text-[16px] shadow-sm mb-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#004772] disabled:active:scale-100"
            style={{ fontFamily: "Albert Sans, sans-serif" }}
          >
            {pwSubmitting ? "Signing in..." : "Sign in"}
          </button>
        ) : (
          <button
            onClick={handleSendOTP}
            disabled={sending}
            className="w-full py-3.5 bg-[#004772] hover:bg-[#003a5c] active:scale-[0.98] text-white font-normal rounded-xl transition-all text-[16px] shadow-sm mb-5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#004772] disabled:active:scale-100"
            style={{ fontFamily: "Albert Sans, sans-serif" }}
          >
            {sending ? "Sending..." : "Send OTP"}
          </button>
        )}

        {/* Divider -- hidden only on the focused single-field password-entry step */}
        {!(mode === "password" && pwStep === "signin") && (
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span
              className="text-[16px] text-gray-400 font-medium"
              style={{ fontFamily: "Albert Sans, sans-serif" }}
            >
              OR
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        )}

        {/* Social buttons */}
        {!(mode === "password" && pwStep === "signin") && (
        <div className="flex items-center justify-center gap-5 mb-6">
          {mode === "phone" || (mode === "password" && pwStep === "email") ? (
            /* Google */
            <button
              onClick={handleGoogleSignIn}
              className="w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md"
            >
              <GoogleIcon />
            </button>
          ) : (
            /* Phone login */
            <button
              onClick={() => setMode("phone")}
              className="w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Phone className="w-5 h-5 text-figma-navy" />
            </button>
          )}
        </div>
        )}

        {/* Switch mode */}
        {mode === "phone" && (
          <p className="text-center text-[13px] text-gray-500 mb-4">
            <button
              onClick={() => {
                setPwStep("email");
                setMode("password");
              }}
              className="text-figma-navy hover:underline font-medium"
            >
              Sign in with a password instead
            </button>
          </p>
        )}
        {mode === "email" && (
          <p className="text-center text-[13px] text-gray-500 mb-4">
            <button
              onClick={() => {
                setPwStep("email");
                setMode("password");
              }}
              className="text-figma-navy hover:underline font-medium"
            >
              Sign in with a password instead
            </button>
          </p>
        )}
        {mode === "password" && pwStep === "email" && (
          <p className="text-center text-[13px] text-gray-500 mb-4">
            <button
              onClick={() => setMode("phone")}
              className="text-figma-navy hover:underline font-medium"
            >
              Sign in with mobile number instead
            </button>
          </p>
        )}

        {/* Skip / browse as guest */}
        <button
          onClick={handleSkip}
          className="w-full flex items-center justify-center gap-2 py-3 mb-4 rounded-xl border border-gray-200 text-gray-600 font-medium text-[14px] hover:bg-gray-50 transition-all"
        >
          <Compass className="w-4 h-4" />
          Skip for now: browse properties
        </button>

        {/* Terms */}
        <p className="text-center text-[11px] text-gray-400 leading-relaxed">
          By continuing, you agree to Hostiggo&apos;s{" "}
          <a href="/terms" className="text-figma-navy hover:underline">
            Terms and Conditions
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-figma-navy hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
      <SignInContent />
    </Suspense>
  );
}

function GoogleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
