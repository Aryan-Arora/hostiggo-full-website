'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { setStoredUserId } from '@/lib/api';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase client is configured with detectSessionInUrl: true
        // It will automatically exchange the OAuth code from URL params
        
        // Wait for the auth state to be ready
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[auth/callback] Session error:', sessionError);
          setError(sessionError.message);
          return;
        }

        if (session?.user?.id) {
          await handleSession(session);
          return;
        }

        // If no session yet, listen for auth state change
        // This handles the case where the page loads before Supabase processes the URL
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user?.id) {
              subscription.unsubscribe();
              await handleSession(session);
            }
          }
        );

        // Timeout after 10 seconds if no session is established
        const timeout = setTimeout(() => {
          subscription.unsubscribe();
          if (!session?.user?.id) {
            setError('Authentication timed out. Please try again.');
          }
        }, 10000);

        return () => {
          clearTimeout(timeout);
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('[auth/callback] Error:', err);
        setError('Authentication failed. Please try again.');
      }
    };

    const handleSession = async (session: any) => {
      if (session?.user?.id) {
        setStoredUserId(session.user.id);
        try {
          const user = session.user;
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
        
        // Check for redirect param
        const redirect = searchParams?.get('redirect') || '/';
        router.push(redirect);
      } else {
        setError('No session found. Please try signing in again.');
      }
    };

    handleCallback();
  }, [router, searchParams]);

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
