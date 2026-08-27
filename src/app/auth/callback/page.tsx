'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const redirectTarget = searchParams?.get('redirect') || '/onboarding?mode=google';

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
      await signIn(user.id);
      if (!active) return;
      router.push(redirectTarget);
    };

    // A provider-side denial (e.g. "Cancel" on Google's consent screen)
    // comes back as ?error=... on this page, not as a Supabase session --
    // detectSessionInUrl won't produce one. Forward it to the sign-in page,
    // which already has toast handling for this (previously dead code,
    // since nothing routed errors there).
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const oauthError = searchParams?.get('error') || hashParams.get('error');
    if (oauthError) {
      router.replace(`/signin?error=${encodeURIComponent(oauthError)}`);
      return;
    }

    (async () => {
      // Supabase client is configured with detectSessionInUrl: true -- it
      // exchanges the OAuth code from the URL automatically.
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;

      if (sessionError) {
        console.error('[auth/callback] Session error:', sessionError);
        setError(sessionError.message);
        return;
      }

      if (session?.user?.id) {
        await finish(session);
        return;
      }

      // Session not established yet -- the URL exchange may still be in
      // flight. Listen for it instead of polling.
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
        if (event === 'SIGNED_IN' && newSession?.user?.id) {
          subscription.unsubscribe();
          clearTimeout(timeoutId);
          finish(newSession);
        }
      });

      timeoutId = setTimeout(() => {
        subscription.unsubscribe();
        if (active) setError('Authentication timed out. Please try again.');
      }, 10000);

      return () => subscription.unsubscribe();
    })();

    return () => {
      active = false;
      clearTimeout(timeoutId);
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
