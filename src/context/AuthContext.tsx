'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  api,
  getStoredUserId,
  setStoredUserId,
  clearStoredAuth,
  type CurrentUser,
} from '@/lib/api';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: CurrentUser | null;
  userId: string | null;
  loading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  /** Persist the user id and load the profile (call after OTP verify or OAuth callback). */
  signIn: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<(AuthState & AuthActions) | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async (id: string) => {
    try {
      const profile = await api.getUser(id);
      setUser(profile ?? null);
    } catch (err) {
      console.error('[auth] failed to load user profile:', err);
      setUser(null);
    }
  }, []);

  // Resolve the stored session on mount.
  useEffect(() => {
    let mounted = true;
    const stored = getStoredUserId();
    if (!stored) {
      setLoading(false);
    } else {
      setUserId(stored);
      loadUser(stored).finally(() => {
        if (mounted) setLoading(false);
      });
    }
    return () => {
      mounted = false;
    };
  }, [loadUser]);

  // Google OAuth and email OTP both establish a real Supabase Auth session
  // (phone OTP doesn't -- it's verified server-side and only ever gives us
  // a userId, never a client-side session). This listener keeps our
  // locally-stored userId in sync when one of those sessions ends outside
  // our own signOut() call -- e.g. token refresh failure after being idle,
  // or signing out in another tab.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        clearStoredAuth();
        setUser(null);
        setUserId(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(
    async (id: string) => {
      setStoredUserId(id);
      setUserId(id);
      setLoading(true);
      await loadUser(id);
      setLoading(false);
    },
    [loadUser],
  );

  const signOut = useCallback(async () => {
    // Invalidates the real Supabase session (Google/email OTP). Phone OTP
    // never has one client-side, so this is a harmless no-op for that case.
    // Skipping this used to leave a Google session alive after "sign out",
    // which the app would silently pick back up on the next session check.
    await supabase.auth.signOut().catch(() => {});
    clearStoredAuth();
    setUser(null);
    setUserId(null);
    router.push('/signin');
  }, [router]);

  const refresh = useCallback(async () => {
    if (userId) await loadUser(userId);
  }, [userId, loadUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        userId,
        loading,
        isAuthenticated: Boolean(userId),
        signIn,
        signOut,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
