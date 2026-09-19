# 🫖 Tea Shop Management System (Multi-Tenant SaaS)

An enterprise-grade, high-performance Tea Shop Management & POS Application built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, **Zustand**, **TanStack Query**, and **Supabase PostgreSQL**.

---

## 🌟 Key Features

### 👑 1. Super Admin Portal
- **Tenant & Shop Management**: Create shops, view active subscriptions, extend/renew subscriptions, suspend or delete stores.
- **Shop Admins Registry**: Manage store owners, assign stores, reset credentials.
- **Global Platform Analytics**: Cross-shop sales, active licenses, daily platform transactions, renewal forecasting.
- **Platform Settings**: System configurations, default GST rates, and notification preferences.

### 🏪 2. Shop Admin (Owner / Manager) Portal
- **Dashboard**: Real-time sales KPIs, order volume, daily profits, cash register summary, and low-inventory alerts.
- **Point of Sale (POS)**: High-speed barcode/touch billing, product sizing/variants (Cutting, Kulhad, Regular, Flask), custom addons (Extra Elaichi, Ginger, Jaggery), discounts, and instant thermal receipt printing.
- **Menu & Catalog**: Dynamic categories, products, sizing variants, addons, and recipe bill-of-materials.
- **Raw Materials & Inventory**: Real-time stock levels, low-stock notifications, restock history, and wastage logging.
- **Suppliers & Purchases**: Inward supplier shipments, purchase invoices, and vendor contact books.
- **Expense Tracker**: Daily tea shop operational expenses (LPG gas cylinders, milk deliveries, rent, electricity, maintenance).
- **Cash Drawer Management**: Shift opening float, day cash tally, petty cash in/out, and discrepancy balancing.
- **Staff & Payroll**: Employee roster, role assignment, monthly salary slips, and cash advances.
- **Attendance & Clock-In**: Staff attendance tracking, check-in / check-out times, and daily shift logs.
- **Comprehensive Reports**: Sales trends, top-selling chai varieties, profit & loss statement, and GST export.
- **Shop Settings**: Store branding, receipt header/footer, currency (INR ₹), tax rates.

### ☕ 3. Employee (Cashier / Barista) Portal
- **Fast-Action POS**: Instant tap-to-order grid with visual beverage cards, fast category switching, modifier modals, and split/cash/UPI payments.
- **Cash Register Drawer**: Active shift balance, recording cash intake and drops.
- **Shift Reports**: Personal sales performance and items sold during the active shift.
- **Barista Profile & Attendance**: Personal clock-in / clock-out status and shift timings.

---

## 🏗️ Project Structure

```
tea-shop-management/
│
├── frontend/                  # React + TypeScript + Vite Application
│   ├── src/
│   │   ├── assets/            # Icons, imagery & branding
│   │   ├── components/        # Reusable UI, forms, tables & modals
│   │   ├── layouts/           # SuperAdminLayout, AdminLayout, EmployeeLayout
│   │   ├── pages/             # Auth, SuperAdmin, Admin, Employee sub-pages
│   │   ├── features/          # Feature logic, queries & mutations
│   │   ├── stores/            # Zustand stores (Auth, Cart, Shop, Register)
│   │   ├── services/          # Supabase client & robust offline fallback
│   │   ├── lib/               # Supabase setup, permissions, constants
│   │   └── types/             # Full PostgreSQL & TypeScript typings
│   ├── .env                   # Supabase environment variables
│   └── vite.config.ts
│
├── supabase/                  # PostgreSQL Schema & Migrations
│   ├── migrations/            # 20 granular SQL migration files
│   ├── combined_migrations.sql# Single file for 1-click execution in Supabase SQL editor
│   ├── seed.sql               # Starter shops, chai menu, inventory & suppliers
│   └── config.toml            # Supabase CLI config
│
├── .gitignore
├── README.md
└── package.json
```

---

## ⚡ Getting Started

### 1. Configure Supabase PostgreSQL

You can apply the database schema to your Supabase project in two ways:

#### Option A: Supabase SQL Editor (Fastest - 1 Click)
1. Open your Supabase project dashboard: [https://supabase.com/dashboard/project/gvpqxpgtpzznzpumsccq](https://supabase.com/dashboard/project/gvpqxpgtpzznzpumsccq)
2. Go to the **SQL Editor** tab.
3. Open `supabase/combined_migrations.sql` in this repo, copy all contents, and click **Run**.
4. (Optional) Run `supabase/seed.sql` to populate sample artisan tea shops, Chai Craft menus, and ingredients!

#### Option B: Supabase CLI
```bash
npx supabase db push
npx supabase db reset --seed
```

---

### 2. Run the Frontend Locally

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Demo Access & Role Switching

The login page contains a **One-Click Quick Login** bar allowing instant switching between:
- 👑 **Super Admin**: Platform overview and multi-shop management
- 🏪 **Shop Admin**: Chai Craft store owner with POS, inventory, payroll, and reports
- ☕ **Employee**: Cashier & Barista touch POS terminal

If you connect with live Supabase authentication, the app uses your Supabase auth tokens and PostgreSQL Row-Level-Security (RLS).
