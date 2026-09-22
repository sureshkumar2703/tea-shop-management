export type UserRole = 'OWNER' | 'ADMIN' | 'EMPLOYEE';
export type ShopStatus = 'ACTIVE' | 'EXPIRED' | 'TRIAL' | 'SUSPENDED';
export type PaymentMethod = 'CASH' | 'UPI_QR' | 'CARD' | 'CREDIT' | 'SPLIT';
export type OrderStatus = 'COMPLETED' | 'CANCELLED' | 'REFUNDED' | 'PENDING';
export type StockUnit = 'KG' | 'GRAM' | 'LITER' | 'ML' | 'PIECE' | 'BOX';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE';
export type RegisterStatus = 'OPEN' | 'CLOSED';

export interface Shop {
  id: string;
  name: string;
  slug: string;
  shop_code?: string;
  tagline?: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  gst_number?: string;
  currency: string;
  tax_rate: number;
  subscription_status: ShopStatus;
  subscription_start_date: string;
  subscription_end_date: string;
  start_date?: string;
  expiry_date?: string;
  is_lifetime?: boolean;
  logo_url?: string;
  gpay_qr_url?: string;
  receipt_footer?: string;
  is_active: boolean;
  settings?: {
    allow_discounts: boolean;
    enable_qr_menu: boolean;
    enable_sms_receipts: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  shop_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  address?: string;
  country?: string;
  state?: string;
  district?: string;
  is_active: boolean;
  hourly_rate?: number;
  monthly_salary?: number;
  joining_date?: string;
  created_at: string;
  updated_at: string;
  shop?: Shop;
}

export interface Category {
  id: string;
  shop_id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image_url?: string;
  has_regular_thirsty?: boolean;
  regular_thirsty_types?: string[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  shop_id: string;
  name: string;
  price: number;
  cost_price?: number;
  sku?: string;
  is_default: boolean;
  sort_order?: number;
}

export interface Addon {
  id: string;
  shop_id: string;
  name: string;
  price: number;
  cost_price?: number;
  is_available: boolean;
  category_id?: string;
}

export interface Product {
  id: string;
  shop_id: string;
  category_id?: string;
  name: string;
  sku?: string;
  barcode?: string;
  description?: string;
  unit_mode?: 'QTY' | 'WEIGHT';
  weight_unit?: 'GM' | 'KG';
  stock_quantity?: number;
  available_weight?: number;
  price_mode?: 'STANDARD' | 'REGULAR_THIRSTY';
  regular_price?: number;
  thirsty_price?: number;
  base_price: number;
  cost_price?: number;
  preparation_time_minutes?: number;
  is_available: boolean;
  is_active?: boolean;
  is_featured?: boolean;
  image_url?: string;
  tax_rate?: number;
  calories?: number;
  tags?: string[];
  variants?: ProductVariant[];
  category?: Category;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  shop_id: string;
  name: string;
  sku?: string;
  category?: string;
  unit: StockUnit;
  current_stock: number;
  min_alert_threshold: number;
  ideal_stock?: number;
  cost_per_unit: number;
  supplier_name?: string;
  last_restocked_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  shop_id: string;
  name: string;
  contact_person?: string;
  phone: string;
  email?: string;
  address?: string;
  gst_number?: string;
  payment_terms?: string;
  is_active: boolean;
  created_at: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  inventory_item_id: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
  inventory_item?: InventoryItem;
}

export interface Purchase {
  id: string;
  shop_id: string;
  supplier_id?: string;
  invoice_number?: string;
  purchase_date: string;
  total_amount: number;
  paid_amount: number;
  payment_status: 'PAID' | 'PARTIAL' | 'PENDING';
  payment_method: PaymentMethod;
  notes?: string;
  supplier?: Supplier;
  items?: PurchaseItem[];
  created_at: string;
}

export interface Expense {
  id: string;
  shop_id: string;
  title: string;
  category: string;
  amount: number;
  payment_method: PaymentMethod;
  expense_date: string;
  receipt_url?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface OrderItemAddon {
  id: string;
  order_item_id: string;
  addon_id?: string;
  addon_name: string;
  price: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  variant_id?: string;
  product_name: string;
  variant_name?: string;
  unit_mode?: 'QTY' | 'WEIGHT';
  weight_grams?: number;
  weight_kg?: number;
  size_variant?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
  addons?: OrderItemAddon[];
}

export interface Order {
  id: string;
  shop_id: string;
  order_number: string;
  cashier_id?: string;
  customer_name?: string;
  customer_phone?: string;
  order_type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  discount_reason?: string;
  total_amount: number;
  payment_method: PaymentMethod;
  cash_amount?: number;
  gpay_amount?: number;
  is_split_payment?: boolean;
  payment_status: 'PAID' | 'REFUNDED' | 'PENDING';
  status: OrderStatus;
  notes?: string;
  items?: OrderItem[];
  created_at: string;
  cashier?: Profile;
}

export interface Datepay {
  id: string;
  shop_id: string;
  date: string;
  investment_amount: number;
  total_billing_cash: number;
  total_billing_gpay: number;
  total_billing: number;
  total_expenses: number;
  calculated_balance: number;
  actual_closing_cash?: number;
  status: 'OPEN' | 'SETTLED' | 'CLOSED';
  notes?: string;
  recorded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CashRegister {
  id: string;
  shop_id: string;
  cashier_id: string;
  opened_at: string;
  closed_at?: string;
  opening_float: number;
  expected_cash: number;
  actual_cash?: number;
  difference?: number;
  cash_sales: number;
  upi_sales: number;
  card_sales: number;
  cash_in: number;
  cash_out: number;
  status: RegisterStatus;
  notes?: string;
  cashier?: Profile;
}

export interface Salary {
  id: string;
  shop_id: string;
  employee_id: string;
  month: number;
  year: number;
  base_salary: number;
  allowances: number;
  bonus: number;
  advances_deducted: number;
  other_deductions: number;
  net_payable: number;
  paid_amount: number;
  payment_status: 'PENDING' | 'PAID' | 'PARTIAL';
  payment_method: PaymentMethod;
  payment_date?: string;
  notes?: string;
  employee?: Profile;
}

export interface Attendance {
  id: string;
  shop_id: string;
  employee_id: string;
  attendance_date: string;
  check_in?: string;
  check_out?: string;
  total_hours: number;
  status: AttendanceStatus;
  notes?: string;
  employee?: Profile;
}

export interface Notification {
  id: string;
  shop_id?: string;
  user_id?: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
  link?: string;
  is_read: boolean;
  created_at: string;
}
