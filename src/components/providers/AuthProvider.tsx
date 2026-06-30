"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
});

export function useSupabaseAuth() {
  return useContext(SupabaseAuthContext);
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        window.localStorage.setItem("hostiggo:user-id", session.user.id);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.id) {
        window.localStorage.setItem("hostiggo:user-id", session.user.id);
      } else if (event === "SIGNED_OUT") {
        window.localStorage.removeItem("hostiggo:user-id");
        window.localStorage.removeItem("hostiggo:phone");
        window.localStorage.removeItem("hostiggo:email");
      }
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    window.localStorage.removeItem("hostiggo:user-id");
    window.localStorage.removeItem("hostiggo:phone");
    window.localStorage.removeItem("hostiggo:email");
  }, []);

  return (
    <SupabaseAuthContext.Provider
      value={{ user, session, isLoading, signOut }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
}
