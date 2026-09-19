export * from './database.types';

export interface CartItemAddon {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  cartItemId: string; // unique item id in cart (product + variant + addons combo)
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  unitMode?: 'QTY' | 'WEIGHT';
  weightGrams?: number;
  weightKg?: number;
  sizeVariant?: string; // 'Regular', 'Thirsty', etc.
  unitPrice: number;
  quantity: number;
  subtotal: number;
  image?: string;
  notes?: string;
  addons: CartItemAddon[];
}

export interface CartSummary {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  discountReason?: string;
  total: number;
  itemCount: number;
}
