import { usersAPI } from "@/lib/services/user";

// Shared by every auth route (OTP, password) that can hand back a brand-new
// Supabase Auth user with no matching row in our own `users` table yet --
// creates it on first sign-in, otherwise returns the existing profile
// untouched.
export const ensureProfile = async (user: {
  id: string;
  phone?: string;
  email?: string;
  user_metadata?: Record<string, any>;
}) => {
  const existing = await usersAPI.getUserById(user.id);
  if (existing) return existing;
  return usersAPI.upsertUser({
    user_id: user.id,
    name: user.user_metadata?.full_name || user.user_metadata?.name || "",
    email: user.email || user.user_metadata?.email || "",
    phone: user.phone || null,
    age: user.user_metadata?.age || null,
    emergency_contact: user.user_metadata?.emergency_contact || null,
    is_verified: true,
    is_active: true,
  });
};
