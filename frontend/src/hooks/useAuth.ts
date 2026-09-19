import { useAuthStore } from "@/stores/authStore";

export const useAuth = () => {
  const store = useAuthStore();
  return {
    user: store.user,
    role: store.role,
    shop: store.shop,
    isLoading: store.isLoading,
    loginWithSupabase: store.loginWithSupabase,
    logout: store.logout,
    setShop: store.setShop,
  };
};
