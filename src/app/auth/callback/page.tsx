'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

const POST_AUTH_REDIRECT_KEY = 'hostiggo:post-auth-redirect';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    let subscription: { unsubscribe: () => void } | undefined;

    // Where to land once signed in. The sign-in page stashes this in
    // sessionStorage (so redirectTo can stay a bare, allow-listed URL); the
    // old `?redirect=` query param is still honored as a fallback.
    let redirectTarget = '/onboarding?mode=google';
    try {
      const stashed = window.sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
      if (stashed) redirectTarget = stashed;
    } catch {
      /* storage disabled -- use default */
    }
    const queryRedirect = searchParams?.get('redirect');
    if (queryRedirect) redirectTarget = queryRedirect;

    const clearStash = () => {
      try {
        window.sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
      } catch {
        /* ignore */
      }
    };

    const finish = async (session: Session) => {
      if (!active) return;
      const user = session.user;
      try {
        // Upsert the profile from Google's identity data before signIn()
        // loads it -- otherwise the first load races the write and can come
        // back empty.
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            name: user.user_metadata?.full_name || user.user_metadata?.name || '',
            email: user.email || user.user_metadata?.email || '',
            phone: user.phone || null,
            profile_pic_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            is_verified: true,
            is_active: true,
          }),
        });
      } catch (e) {
        console.error('[auth/callback] Failed to create profile:', e);
      }
      if (!active) return;

      // The POST above no longer reactivates an existing deactivated row
      // (see /api/users), so a deactivated user coming back through Google
      // still lands here with is_active: false. Google/GoTrue also bans
      // the auth user on deactivation, but that's a defense-in-depth check,
      // not the only one -- deny the app-level session here too rather than
      // trust an already-established Supabase session.
      try {
        const profile = await api.getUser(user.id);
        if (profile && profile.is_active === false) {
          await supabase.auth.signOut().catch(() => {});
          if (!active) return;
          clearStash();
          router.replace('/signin?error=account_deactivated');
          return;
        }
      } catch (e) {
        console.error('[auth/callback] Failed to check account status:', e);
      }

      if (!active) return;
      await signIn(user.id);
      if (!active) return;
      clearStash();
      // Best-effort -- see /api/auth/log-login for why this can't be logged
      // server-side the way OTP/password sign-ins are.
      fetch('/api/auth/log-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, method: 'google' }),
      }).catch(() => {});
      router.replace(redirectTarget);
    };

    // A provider-side denial (e.g. "Cancel" on Google's consent screen) or a
    // Supabase-side failure comes back as an error on this URL, not as a
    // session. With the PKCE flow it's a `?error=...&error_description=...`
    // query param; the implicit flow used to put it in the hash. Handle both
    // and forward to the sign-in page, which has the toast handling for it.
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const oauthError =
      searchParams?.get('error') ||
      searchParams?.get('error_code') ||
      hashParams.get('error') ||
      hashParams.get('error_code');
    const oauthErrorDescription =
      searchParams?.get('error_description') || hashParams.get('error_description');
    if (oauthError) {
      console.error('[auth/callback] OAuth error:', oauthError, oauthErrorDescription);
      clearStash();
      router.replace(`/signin?error=${encodeURIComponent(oauthError)}`);
      return;
    }

    // Neither a code (PKCE), a token fragment (implicit / magic link), nor an
    // error -- this page was opened directly or the provider redirect was
    // misconfigured (e.g. redirectTo not on the Supabase "Redirect URLs"
    // allow list, so Supabase bounced to the Site URL instead of here).
    const hasCode = Boolean(searchParams?.get('code'));
    const hasTokenFragment = hashParams.has('access_token');
    if (!hasCode && !hasTokenFragment) {
      console.error('[auth/callback] Opened with no auth code, token or error param');
      clearStash();
      router.replace('/signin?error=no_oauth_response');
      return;
    }

    (async () => {
      // detectSessionInUrl (set in src/lib/supabase.ts) exchanges the `?code=`
      // for a session during client init; getSession() awaits that init, so a
      // successful exchange is already reflected here.
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (!active) return;

      if (sessionError) {
        console.error('[auth/callback] Session error:', sessionError);
        clearStash();
        setError('Could not complete sign-in. Please try again.');
        return;
      }

      if (session?.user?.id) {
        await finish(session);
        return;
      }

      // Exchange may still be in flight -- listen for it rather than poll,
      // with a bounded timeout so a stuck exchange surfaces an error instead
      // of spinning forever.
      const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
        if (event === 'SIGNED_IN' && newSession?.user?.id) {
          subscription?.unsubscribe();
          clearTimeout(timeoutId);
          finish(newSession);
        }
      });
      subscription = data.subscription;

      timeoutId = setTimeout(() => {
        subscription?.unsubscribe();
        if (!active) return;
        clearStash();
        setError('Sign-in timed out. Please try again.');
      }, 8000);
    })();

    return () => {
      active = false;
      clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full mx-4 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push('/signin')}
            className="px-6 py-2.5 bg-[#004772] text-white rounded-xl font-medium hover:bg-[#003a5c] transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full mx-4 text-center">
        <div className="w-10 h-10 border-4 border-[#004772] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Signing you in...</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full mx-4 text-center">
          <div className="w-10 h-10 border-4 border-[#004772] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Signing you in...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
