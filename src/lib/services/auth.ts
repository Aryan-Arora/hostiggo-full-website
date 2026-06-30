import { supabase } from "../supabase";

export const authApi = {
  getSession: async () => {
    return await supabase.auth.getSession();
  },

  signInWithOtp: async (phone: string) => {
    return await supabase.auth.signInWithOtp({ phone });
  },

  signInWithEmailOtp: async (email: string) => {
    return await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
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
    return await supabase.auth.verifyOtp({
      phone: params.phone!,
      token: params.token,
      type: "sms",
    });
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
