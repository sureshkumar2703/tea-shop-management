import {
  Shop,
  Profile,
  Category,
  Product,
  InventoryItem,
  Supplier,
  Expense,
  Order,
  CashRegister,
  Salary,
  Attendance,
  Datepay,
  Purchase,
} from "@/types";

export const MOCK_CURRENT_SHOP: Shop = {
  id: "a1111111-1111-1111-1111-111111111111",
  name: "My Tea Shop",
  slug: "my-tea-shop",
  shop_code: "TEA-001",
  tagline: "Authentic Tea & Snacks",
  address: "",
  phone: "",
  email: "",
  gst_number: "",
  currency: "INR",
  tax_rate: 5.0,
  subscription_status: "ACTIVE",
  subscription_start_date: new Date().toISOString(),
  subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  start_date: new Date().toISOString().split("T")[0],
  is_lifetime: true,
  gpay_qr_url: "",
  receipt_footer: "Thank you for visiting!",
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const MOCK_SHOPS_LIST: Shop[] = [];
export const MOCK_CATEGORIES: Category[] = [];
export const MOCK_PRODUCTS: Product[] = [];
export const MOCK_ADDONS: { id: string; name: string; price: number; is_available: boolean }[] = [];
export const MOCK_INVENTORY: InventoryItem[] = [];
export const MOCK_SUPPLIERS: Supplier[] = [];
export const MOCK_EXPENSES: Expense[] = [];
export const MOCK_PURCHASES: Purchase[] = [];
export const MOCK_ORDERS: Order[] = [];

export const MOCK_CASH_REGISTER: CashRegister = {
  id: "reg-init",
  shop_id: "",
  cashier_id: "",
  opened_at: new Date().toISOString(),
  opening_float: 0.0,
  expected_cash: 0.0,
  cash_sales: 0.0,
  upi_sales: 0.0,
  card_sales: 0.0,
  cash_in: 0.0,
  cash_out: 0.0,
  status: "CLOSED",
};

export const MOCK_EMPLOYEES: Profile[] = [];
export const MOCK_SALARIES: Salary[] = [];
export const MOCK_ATTENDANCE: Attendance[] = [];
export const MOCK_DATEPAYS: Datepay[] = [];
