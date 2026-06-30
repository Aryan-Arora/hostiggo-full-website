'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { setStoredUserId } from '@/lib/api';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        setError(error.message);
        return;
      }

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
        router.push('/');
      } else {
        setError('No session found. Please try signing in again.');
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full mx-4 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push('/signin')}
            className="px-6 py-2.5 bg-[#1B3FA0] text-white rounded-xl font-medium hover:bg-[#162e82] transition-colors"
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
        <div className="w-10 h-10 border-4 border-[#1B3FA0] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Signing you in...</p>
      </div>
    </div>
  );
}
