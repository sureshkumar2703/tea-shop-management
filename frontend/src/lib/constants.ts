export const APP_NAME = "ChaiCraft Enterprise";
export const APP_TAGLINE = "Smart Artisan Tea Shop Management & POS";
export const DEFAULT_CURRENCY = "INR";
export const CURRENCY_SYMBOL = "₹";

export const SUPABASE_STORAGE_BUCKET =
  import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "Tea-Shop-Images";

export const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Cash (Cash Drawer)', icon: 'Banknote', color: 'text-emerald-600' },
  { id: 'UPI_QR', label: 'Instant UPI / QR', icon: 'QrCode', color: 'text-amber-600' },
  { id: 'CARD', label: 'Debit / Credit Card', icon: 'CreditCard', color: 'text-blue-600' },
  { id: 'SPLIT', label: 'Split Payment', icon: 'GitFork', color: 'text-purple-600' },
] as const;

export const EXPENSE_CATEGORIES = [
  'Milk & Dairy Supply',
  'Tea Leaves & Spices',
  'LPG Gas Cylinders',
  'Shop Rent',
  'Electricity & Utilities',
  'Cleaning & Sanitization',
  'Packaging & Kulhads',
  'Staff Meals & Refreshments',
  'Equipment Repair & Maintenance',
  'Marketing & Promos',
  'Miscellaneous',
] as const;

export const DEMO_USERS = {
  SUPER_ADMIN: {
    email: 'superadmin@admin.com',
    role: 'SUPER_ADMIN' as const,
    name: 'Vikramaditya Singhania',
    shopName: 'Global Platform Control'
  },
  ADMIN: {
    email: 'owner@chaicraft.com',
    role: 'ADMIN' as const,
    name: 'Aarav Sharma',
    shopName: 'Chai Craft Artisan Bar (Central)'
  },
  EMPLOYEE: {
    email: 'cashier@chaicraft.com',
    role: 'EMPLOYEE' as const,
    name: 'Pooja Verma',
    shopName: 'Chai Craft Artisan Bar (Central)'
  }
};
