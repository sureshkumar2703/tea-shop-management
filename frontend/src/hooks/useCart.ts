import { useCartStore } from "@/stores/cartStore";

export const useCart = () => {
  return useCartStore();
};
