import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { UserRole, Profile, Shop } from "@/types";
import { supabase } from "@/lib/supabase";

interface AuthState {
  user: Profile | null;
  shop: Shop | null;
  role: UserRole | null;
  isLoading: boolean;
  loginWithSupabase: (email: string, pass: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  setShop: (shop: Shop) => void;
  initSession: () => Promise<void>;
}

// ─── Map `users` table row → Profile interface ─────────────────────────────
function mapUserRow(row: any, shop?: any): Profile {
  return {
    id: row.id,
    shop_id: row.shop_id ?? undefined,
    full_name: row.name || row.full_name || "User",
    email: row.email,
    phone: row.phone ?? undefined,
    role: row.role as UserRole,
    address: row.address ?? undefined,
    country: row.country ?? undefined,
    state: row.state ?? undefined,
    district: row.district ?? undefined,
    monthly_salary: row.salary ?? 0,
    is_active: row.is_active ?? true,
    created_at: row.created_at,
    updated_at: row.updated_at,
    shop: shop ?? undefined,
  };
}

// ─── Validate Shop Active & Expiration Status ─────────────────────────────
function checkShopValidity(shop: any, role: UserRole): { valid: boolean; error?: string } {
  if (role === "ADMIN") {
    // Super Admin is never blocked by shop expiry
    return { valid: true };
  }

  if (!shop) {
    return { valid: true };
  }

  if (shop.is_active === false || shop.subscription_status === "SUSPENDED") {
    return {
      valid: false,
      error: "Your shop/franchise is currently inactive or suspended. Please contact the Super Administrator.",
    };
  }

  if (!shop.is_lifetime) {
    const expiryDateStr = shop.subscription_end_date || shop.expiry_date;
    if (expiryDateStr) {
      const expiry = new Date(expiryDateStr);
      expiry.setHours(23, 59, 59, 999);
      if (expiry.getTime() < Date.now() || shop.subscription_status === "EXPIRED") {
        const formattedDate = new Date(expiryDateStr).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        return {
          valid: false,
          error: `Your shop license expired on ${formattedDate}. Access is disabled. Please contact Super Admin to renew your franchise subscription.`,
        };
      }
    }
  }

  return { valid: true };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      shop: null,
      role: null,
      isLoading: false,

      // ─── Restore session & refresh latest profile on app boot/reload ───────────
      initSession: async () => {
        const currentUser = get().user;
        if (!currentUser) {
          set({ isLoading: true });
        }

        try {
          const { data: { session } } = await supabase.auth.getSession();
          const targetEmail = session?.user?.email || currentUser?.email;

          if (targetEmail) {
            const { data: row } = await supabase
              .from("users")
              .select("*, shop:shops(*)")
              .ilike("email", targetEmail)
              .single();

            if (row) {
              if (row.is_active === false) {
                await get().logout();
                return;
              }

              const profile = mapUserRow(row, row.shop);
              const shopCheck = checkShopValidity(row.shop, profile.role);
              if (!shopCheck.valid) {
                await get().logout();
                return;
              }

              set({
                user: profile,
                role: profile.role,
                shop: row.shop || null,
                isLoading: false,
              });
              return;
            }
          }
        } catch (e) {
          console.warn("Session restore fallback to persisted state:", e);
        }

        set({ isLoading: false });
      },

      // ─── Portal Login (Authenticates with Auth and users table) ───────────────
      loginWithSupabase: async (email: string, pass: string) => {
        set({ isLoading: true });
        const cleanEmail = email.trim().toLowerCase();
        const cleanPass = pass.trim();

        try {
          // 1. Direct lookup in `public.users` table
          const { data: userRow, error: userError } = await supabase
            .from("users")
            .select("*, shop:shops(*)")
            .ilike("email", cleanEmail)
            .single();

          if (!userError && userRow) {
            const expectedPass = userRow.password_hash || userRow.password;
            if (expectedPass && expectedPass === cleanPass) {
              if (userRow.is_active === false) {
                set({ isLoading: false });
                return { error: "Your account has been deactivated. Please contact your Super Administrator." };
              }

              const profile = mapUserRow(userRow, userRow.shop);
              const shopCheck = checkShopValidity(userRow.shop, profile.role);
              if (!shopCheck.valid) {
                set({ isLoading: false });
                return { error: shopCheck.error };
              }

              set({
                user: profile,
                role: profile.role,
                shop: userRow.shop || null,
                isLoading: false,
              });
              return {};
            }
          }

          // 2. Authenticate via Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPass,
          });

          if (!authError && authData.user) {
            const { data: row } = await supabase
              .from("users")
              .select("*, shop:shops(*)")
              .ilike("email", cleanEmail)
              .single();

            if (row) {
              if (row.is_active === false) {
                await supabase.auth.signOut();
                set({ isLoading: false });
                return { error: "Your account has been deactivated. Please contact your Super Administrator." };
              }

              const profile = mapUserRow(row, row.shop);
              const shopCheck = checkShopValidity(row.shop, profile.role);
              if (!shopCheck.valid) {
                await supabase.auth.signOut();
                set({ isLoading: false });
                return { error: shopCheck.error };
              }

              set({
                user: profile,
                role: profile.role,
                shop: row.shop || null,
                isLoading: false,
              });
              return {};
            }
          }

          set({ isLoading: false });
          return {
            error: authError?.message === "Invalid login credentials"
              ? "Incorrect email or password. Please try again."
              : authError?.message || "Incorrect email or password. Please try again.",
          };
        } catch (e: any) {
          set({ isLoading: false });
          return { error: e.message || "An unexpected error occurred. Please try again." };
        }
      },

      // ─── Logout (Clears user, role, shop and Supabase session) ─────────────────
      logout: async () => {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.warn("Signout error:", e);
        }

        // Clear onboarding status from localStorage so next login will trigger onboarding
        try {
          localStorage.removeItem("chaicraft_onboarded");
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith("chaicraft_onboarded")) {
              localStorage.removeItem(key);
            }
          });
        } catch (err) {
          console.warn("Error clearing onboarding from localStorage:", err);
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
    }),
    {
      name: "chaicraft_auth_session", // Persists auth state in localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        shop: state.shop,
      }),
    }
  )
);
