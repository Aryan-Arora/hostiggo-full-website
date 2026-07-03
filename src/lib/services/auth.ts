import { supabase } from "../supabase";

export const authApi = {
  getSession: async () => {
    return await supabase.auth.getSession();
  },

  signInWithOtp: async (phone: string) => {
    return await supabase.auth.signInWithOtp({ 
      phone,
      options: {
        shouldCreateUser: true,
      },
    });
  },

  signInWithEmailOtp: async (email: string) => {
    return await supabase.auth.signInWithOtp({
      email,
      options: { 
        shouldCreateUser: true,
        // Use email link redirect for magic link flow
        emailRedirectTo: typeof window !== 'undefined' 
          ? `${window.location.origin}/auth/callback` 
          : undefined,
      },
    });
  },

  verifyOtp: async (params: { phone?: string; email?: string; token: string; type: "sms" | "email" }) => {
    if (params.type === "email" && params.email) {
      return await supabase.auth.verifyOtp({
        email: params.email,
        token: params.token,
        type: "email",
      });
    }
    if (params.phone) {
      return await supabase.auth.verifyOtp({
        phone: params.phone,
        token: params.token,
        type: "sms",
      });
    }
    throw new Error("Either phone or email must be provided for OTP verification");
  },

  updateUser: async (attributes: { phone?: string; email?: string }) => {
    return await supabase.auth.updateUser(attributes);
  },

  signOut: async () => {
    return await supabase.auth.signOut();
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};
