import { create } from "zustand";
import { Product, ProductVariant, CartItem, CartItemAddon } from "@/types";

interface CartState {
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  orderType: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  discountAmount: number;
  discountReason: string;
  taxRate: number; // default 5%
  
  // Actions
  addItem: (product: Product, variant?: ProductVariant, addons?: CartItemAddon[], notes?: string) => void;
  addCustomItem: (params: {
    product: Product;
    variantName?: string;
    sizeVariant?: string;
    unitMode?: "QTY" | "WEIGHT";
    weightGrams?: number;
    weightKg?: number;
    unitPrice: number;
    quantity?: number;
    addons?: CartItemAddon[];
    notes?: string;
  }) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  setCustomerInfo: (name: string, phone: string) => void;
  setOrderType: (type: "DINE_IN" | "TAKEAWAY" | "DELIVERY") => void;
  setDiscount: (amount: number, reason?: string) => void;
  
  // Computations
  getSubtotal: () => number;
  getTaxAmount: () => number;
  getTotalAmount: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerName: "Walk-in Guest",
  customerPhone: "",
  orderType: "DINE_IN",
  discountAmount: 0,
  discountReason: "",
  taxRate: 5.0,

  addItem: (product, variant, addons = [], notes = "") => {
    set((state) => {
      const variantName = variant ? variant.name : undefined;
      const unitPrice = (variant ? variant.price : product.base_price) + addons.reduce((sum, a) => sum + a.price, 0);
      const addonIds = addons.map((a) => a.id).sort().join("-");
      const cartItemId = `${product.id}_${variant?.id || "def"}_${addonIds}`;

      const existingIndex = state.items.findIndex((item) => item.cartItemId === cartItemId);

      if (existingIndex > -1) {
        const updatedItems = [...state.items];
        const item = updatedItems[existingIndex];
        const newQty = item.quantity + 1;
        updatedItems[existingIndex] = {
          ...item,
          quantity: newQty,
          subtotal: newQty * item.unitPrice,
        };
        return { items: updatedItems };
      }

      const newItem: CartItem = {
        cartItemId,
        productId: product.id,
        variantId: variant?.id,
        name: product.name,
        variantName,
        unitPrice,
        quantity: 1,
        subtotal: unitPrice,
        addons,
        notes,
      };

      return { items: [newItem, ...state.items] };
    });
  },

  addCustomItem: (params) => {
    set((state) => {
      const {
        product,
        variantName,
        sizeVariant,
        unitMode = "QTY",
        weightGrams,
        weightKg,
        unitPrice,
        quantity = 1,
        addons = [],
        notes = "",
      } = params;

      const addonIds = addons.map((a) => a.id).sort().join("-");
      const weightKey = weightGrams ? `_w${weightGrams}` : "";
      const sizeKey = sizeVariant ? `_s${sizeVariant}` : "";
      const cartItemId = `${product.id}${sizeKey}${weightKey}_${addonIds}_${Date.now()}`;

      const totalUnitPrice = unitPrice + addons.reduce((sum, a) => sum + a.price, 0);
      const subtotal = totalUnitPrice * quantity;

      const newItem: CartItem = {
        cartItemId,
        productId: product.id,
        name: product.name,
        variantName,
        sizeVariant,
        unitMode,
        weightGrams,
        weightKg,
        unitPrice: totalUnitPrice,
        quantity,
        subtotal,
        addons,
        notes,
      };

      return { items: [newItem, ...state.items] };
    });
  },

  removeItem: (cartItemId) => {
    set((state) => ({
      items: state.items.filter((item) => item.cartItemId !== cartItemId),
    }));
  },

  updateQuantity: (cartItemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(cartItemId);
      return;
    }
    set((state) => ({
      items: state.items.map((item) =>
        item.cartItemId === cartItemId
          ? { ...item, quantity, subtotal: quantity * item.unitPrice }
          : item
      ),
    }));
  },

  clearCart: () => {
    set({
      items: [],
      customerName: "Walk-in Guest",
      customerPhone: "",
      discountAmount: 0,
      discountReason: "",
    });
  },

  setCustomerInfo: (customerName, customerPhone) => set({ customerName, customerPhone }),
  setOrderType: (orderType) => set({ orderType }),
  setDiscount: (discountAmount, discountReason = "") => set({ discountAmount, discountReason }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.subtotal, 0);
  },

  getTaxAmount: () => {
    const subtotal = get().getSubtotal();
    const discounted = Math.max(0, subtotal - get().discountAmount);
    return Math.round(discounted * (get().taxRate / 100) * 100) / 100;
  },

  getTotalAmount: () => {
    const subtotal = get().getSubtotal();
    const discounted = Math.max(0, subtotal - get().discountAmount);
    const tax = get().getTaxAmount();
    return Math.round((discounted + tax) * 100) / 100;
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
