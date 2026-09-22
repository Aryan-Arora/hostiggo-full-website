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
  /**
   * Dev-only: establishes a REAL Supabase Auth session for the demo host via
   * /api/dev/demo-session, then calls signIn() for the local state. Unlike
   * plain signIn(), this is what the "Continue as demo host (dev)" button
   * should call -- without a real session, getBearerToken() (src/lib/api.ts)
   * has no access token to attach to authenticated requests, and anything
   * requiring real auth (KYC submission, listing creation, etc.) 401s.
   */
  signInAsDemoHost: (userId: string) => Promise<void>;
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

  // Google OAuth, email OTP and phone OTP all now establish a real Supabase
  // Auth session client-side -- OTP/password verify happens server-side
  // (POST /api/auth/otp, /api/auth/password), so OTPPageContent.tsx and
  // signin/page.tsx explicitly call supabase.auth.setSession() with the
  // tokens that route returns, right after verifying. Without that, this
  // client never learns the session exists and autoRefreshToken has
  // nothing to refresh -- the access token would silently hard-expire
  // (~1hr) with no recovery short of signing in again, which was happening
  // until that fix. This listener keeps our locally-stored userId in sync
  // when one of those sessions ends outside our own signOut() call -- e.g.
  // token refresh failure after being idle, or signing out in another tab.
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

  const signInAsDemoHost = useCallback(
    async (id: string) => {
      const res = await fetch('/api/dev/demo-session', { method: 'POST' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload.error) {
        throw new Error(payload.error || `Failed to establish demo session: ${res.status}`);
      }
      const { access_token, refresh_token } = payload.data ?? {};
      if (!access_token || !refresh_token) {
        throw new Error('Demo session response missing tokens');
      }
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) throw error;
      await signIn(id);
    },
    [signIn],
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
        signInAsDemoHost,
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
