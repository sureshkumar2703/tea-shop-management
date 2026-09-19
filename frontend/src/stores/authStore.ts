import { create } from "zustand";
import { UserRole, Profile, Shop } from "@/types";
import { supabase } from "@/lib/supabase";

interface AuthState {
  user: Profile | null;
  shop: Shop | null;
  role: UserRole | null;
  isLoading: boolean;
  loginWithSupabase: (email: string, pass: string) => Promise<{ error?: string }>;
  logout: () => void;
  setShop: (shop: Shop) => void;
  initSession: () => Promise<void>;
}

// ─── Map `users` table row → Profile interface ─────────────────────────────
// The DB table uses `name` and `salary`; the app uses `full_name` and `monthly_salary`
function mapUserRow(row: any, shop?: any): Profile {
  return {
    id: row.id,
    shop_id: row.shop_id ?? undefined,
    full_name: row.name,           // DB: name  →  App: full_name
    email: row.email,
    phone: row.phone ?? undefined,
    role: row.role as UserRole,
    address: row.address ?? undefined,
    country: row.country ?? undefined,
    state: row.state ?? undefined,
    district: row.district ?? undefined,
    monthly_salary: row.salary ?? 0, // DB: salary  →  App: monthly_salary
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
    shop: shop ?? undefined,
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  shop: null,
  role: null,
  isLoading: false,

  // ─── Restore session on app boot ───────────────────────────────────────────
  initSession: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        set({ user: null, role: null, shop: null, isLoading: false });
        return;
      }

      // Lookup user in `users` table by email (linked via Supabase Auth email)
      const { data: row, error } = await supabase
        .from("users")
        .select("*, shop:shops(*)")
        .eq("email", session.user.email)
        .single();

      if (error || !row) {
        set({ user: null, role: null, shop: null, isLoading: false });
        return;
      }

      const profile = mapUserRow(row, row.shop);
      set({
        user: profile,
        role: profile.role,
        shop: row.shop || null,
        isLoading: false,
      });
    } catch (e) {
      console.warn("Session restore error:", e);
      set({ user: null, role: null, shop: null, isLoading: false });
    }
  },

  // ─── Real Supabase login ───────────────────────────────────────────────────
  loginWithSupabase: async (email: string, pass: string) => {
    set({ isLoading: true });
    try {
      // Step 1: Authenticate with Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: pass,
      });

      if (authError) {
        set({ isLoading: false });
        return {
          error:
            authError.message === "Invalid login credentials"
              ? "Incorrect email or password. Please try again."
              : authError.message,
        };
      }

      if (!data.user) {
        set({ isLoading: false });
        return { error: "Authentication failed. No user returned." };
      }

      // Step 2: Query `users` table by email to get role and shop
      const { data: row, error: userError } = await supabase
        .from("users")
        .select("*, shop:shops(*)")
        .eq("email", data.user.email)
        .single();

      if (userError || !row) {
        await supabase.auth.signOut();
        set({ isLoading: false });
        return {
          error:
            "Your account was authenticated but no user record was found in the system. Please contact the administrator.",
        };
      }

      // Step 3: Check is_active
      if (row.is_active === false) {
        await supabase.auth.signOut();
        set({ isLoading: false });
        return {
          error:
            "Your account has been deactivated. Please contact your shop administrator.",
        };
      }

      // Step 4: Map and set state
      const profile = mapUserRow(row, row.shop);
      set({
        user: profile,
        role: profile.role,
        shop: row.shop || null,
        isLoading: false,
      });

      return {};
    } catch (e: any) {
      set({ isLoading: false });
      return { error: e.message || "An unexpected error occurred. Please try again." };
    }
  },

  // ─── Logout ────────────────────────────────────────────────────────────────
  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Signout error:", e);
    }
    set({
      user: null,
      role: null,
      shop: null,
      isLoading: false,
    });
  },

  // ─── Shop setter ───────────────────────────────────────────────────────────
  setShop: (shop: Shop) => {
    set({ shop });
  },
}));
