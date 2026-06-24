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

interface AuthState {
  user: CurrentUser | null;
  userId: string | null;
  loading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  /** Persist the user id and load the profile (call after OTP verify). */
  signIn: (userId: string) => Promise<void>;
  signOut: () => void;
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
      return;
    }
    setUserId(stored);
    loadUser(stored).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [loadUser]);

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

  const signOut = useCallback(() => {
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
