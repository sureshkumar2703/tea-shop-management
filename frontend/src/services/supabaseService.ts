import { supabase } from "@/lib/supabase";
import {
  Shop,
  Category,
  Product,
  InventoryItem,
  Supplier,
  Expense,
  Order,
  CashRegister,
  Salary,
  Attendance,
  Profile,
  Datepay,
  PaymentMethod,
} from "@/types";
import {
  MOCK_CURRENT_SHOP,
  MOCK_SHOPS_LIST,
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  MOCK_INVENTORY,
  MOCK_SUPPLIERS,
  MOCK_EXPENSES,
  MOCK_ORDERS,
  MOCK_CASH_REGISTER,
  MOCK_EMPLOYEES,
  MOCK_SALARIES,
  MOCK_ATTENDANCE,
  MOCK_DATEPAYS,
} from "./mockData";

// Local storage keys for mutations during demo/offline state
const STORAGE_KEYS = {
  SHOPS: "chaicraft_shops",
  CATEGORIES: "chaicraft_categories",
  PRODUCTS: "chaicraft_products",
  ORDERS: "chaicraft_orders",
  EXPENSES: "chaicraft_expenses",
  INVENTORY: "chaicraft_inventory",
  EMPLOYEES: "chaicraft_employees",
  REGISTER: "chaicraft_register",
  DATEPAYS: "chaicraft_datepays",
  SALARIES: "chaicraft_salaries",
};

function getStoredOr<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Storage write error", e);
  }
}

export const dataService = {
  // SHOPS
  async getShops(): Promise<Shop[]> {
    try {
      const { data, error } = await supabase.from("shops").select("*").order("created_at", { ascending: false });
      if (!error && data && data.length > 0) return data as Shop[];
    } catch (e) {
      console.warn("Supabase query fallback to mock", e);
    }
    return getStoredOr(STORAGE_KEYS.SHOPS, MOCK_SHOPS_LIST);
  },

  async createShop(shopData: Partial<Shop>): Promise<Shop> {
    try {
      const { data, error } = await supabase.from("shops").insert([shopData]).select().single();
      if (!error && data) return data as Shop;
    } catch (e) {
      console.warn("Supabase create fallback", e);
    }
    const newShop: Shop = {
      id: `shop-${Date.now()}`,
      name: shopData.name || "New Artisan Chai Shop",
      slug: shopData.slug || `shop-${Date.now()}`,
      shop_code: shopData.shop_code || `TEA-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      tagline: shopData.tagline || "",
      address: shopData.address || "",
      country: shopData.country || "India",
      state: shopData.state || "",
      city: shopData.city || "",
      pincode: shopData.pincode || "",
      phone: shopData.phone || "",
      email: shopData.email || "",
      currency: "INR",
      tax_rate: shopData.tax_rate || 5.0,
      subscription_status: "ACTIVE",
      subscription_start_date: shopData.subscription_start_date || new Date().toISOString(),
      subscription_end_date: shopData.subscription_end_date || new Date(Date.now() + 365 * 86400000).toISOString(),
      start_date: shopData.start_date || new Date().toISOString().split("T")[0],
      expiry_date: shopData.expiry_date,
      is_lifetime: shopData.is_lifetime || false,
      logo_url: shopData.logo_url,
      gpay_qr_url: shopData.gpay_qr_url,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const current = getStoredOr(STORAGE_KEYS.SHOPS, MOCK_SHOPS_LIST);
    const updated = [newShop, ...current];
    setStored(STORAGE_KEYS.SHOPS, updated);
    return newShop;
  },

  // CATEGORIES
  async getCategories(shopId?: string): Promise<Category[]> {
    try {
      let query = supabase.from("categories").select("*").eq("is_active", true).order("sort_order", { ascending: true });
      if (shopId) query = query.eq("shop_id", shopId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as Category[];
    } catch (e) {
      console.warn("Categories fallback", e);
    }
    return getStoredOr(STORAGE_KEYS.CATEGORIES, MOCK_CATEGORIES);
  },

  async createCategory(catData: Partial<Category>): Promise<Category> {
    try {
      const { data, error } = await supabase.from("categories").insert([catData]).select().single();
      if (!error && data) return data as Category;
    } catch (e) {
      console.warn("Category create fallback", e);
    }
    const newCat: Category = {
      id: `c-${Date.now()}`,
      shop_id: catData.shop_id || MOCK_CURRENT_SHOP.id,
      name: catData.name || "New Category",
      slug: catData.slug || (catData.name ? catData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") : `cat-${Date.now()}`),
      description: catData.description || "",
      has_regular_thirsty: catData.has_regular_thirsty || false,
      regular_thirsty_types: catData.regular_thirsty_types || ["Regular", "Thirsty"],
      sort_order: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const current = getStoredOr(STORAGE_KEYS.CATEGORIES, MOCK_CATEGORIES);
    setStored(STORAGE_KEYS.CATEGORIES, [...current, newCat]);
    return newCat;
  },

  // PRODUCTS
  async getProducts(shopId?: string): Promise<Product[]> {
    try {
      let query = supabase.from("products").select("*, variants:product_variants(*)").eq("is_available", true);
      if (shopId) query = query.eq("shop_id", shopId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as Product[];
    } catch (e) {
      console.warn("Products fallback", e);
    }
    return getStoredOr(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
  },

  async createProduct(productData: Partial<Product>): Promise<Product> {
    try {
      const { data, error } = await supabase.from("products").insert([productData]).select().single();
      if (!error && data) return data as Product;
    } catch (e) {
      console.warn("Product create fallback", e);
    }
    const newProd: Product = {
      id: `p-${Date.now()}`,
      shop_id: productData.shop_id || MOCK_CURRENT_SHOP.id,
      category_id: productData.category_id,
      name: productData.name || "New Tea Item",
      sku: productData.sku || `SKU-${Date.now()}`,
      description: productData.description || "",
      unit_mode: productData.unit_mode || "QTY",
      weight_unit: productData.weight_unit || "GM",
      stock_quantity: productData.stock_quantity ?? 100,
      available_weight: productData.available_weight ?? 0,
      price_mode: productData.price_mode || "STANDARD",
      regular_price: productData.regular_price,
      thirsty_price: productData.thirsty_price,
      base_price: productData.base_price || 0,
      cost_price: productData.cost_price || 0,
      image_url: productData.image_url,
      preparation_time_minutes: productData.preparation_time_minutes || 3,
      is_available: productData.is_available !== false,
      is_active: productData.is_active !== false,
      tax_rate: 5.0,
      variants: productData.variants || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const current = getStoredOr(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
    setStored(STORAGE_KEYS.PRODUCTS, [newProd, ...current]);
    return newProd;
  },

  // INVENTORY
  async getInventory(shopId?: string): Promise<InventoryItem[]> {
    try {
      let query = supabase.from("inventory_items").select("*");
      if (shopId) query = query.eq("shop_id", shopId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as InventoryItem[];
    } catch (e) {
      console.warn("Inventory fallback", e);
    }
    return getStoredOr(STORAGE_KEYS.INVENTORY, MOCK_INVENTORY);
  },

  async updateStock(id: string, newStock: number): Promise<void> {
    try {
      await supabase.from("inventory_items").update({ current_stock: newStock, updated_at: new Date().toISOString() }).eq("id", id);
    } catch (e) {
      console.warn("Inventory update fallback", e);
    }
    const current = getStoredOr(STORAGE_KEYS.INVENTORY, MOCK_INVENTORY);
    const updated = current.map((item) => (item.id === id ? { ...item, current_stock: newStock } : item));
    setStored(STORAGE_KEYS.INVENTORY, updated);
  },

  // SUPPLIERS
  async getSuppliers(shopId?: string): Promise<Supplier[]> {
    try {
      let query = supabase.from("suppliers").select("*").eq("is_active", true);
      if (shopId) query = query.eq("shop_id", shopId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as Supplier[];
    } catch (e) {
      console.warn("Suppliers fallback", e);
    }
    return MOCK_SUPPLIERS;
  },

  // EXPENSES
  async getExpenses(shopId?: string): Promise<Expense[]> {
    try {
      let query = supabase.from("expenses").select("*").order("expense_date", { ascending: false });
      if (shopId) query = query.eq("shop_id", shopId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as Expense[];
    } catch (e) {
      console.warn("Expenses fallback", e);
    }
    return getStoredOr(STORAGE_KEYS.EXPENSES, MOCK_EXPENSES);
  },

  async createExpense(expenseData: Partial<Expense>): Promise<Expense> {
    try {
      const { data, error } = await supabase.from("expenses").insert([expenseData]).select().single();
      if (!error && data) return data as Expense;
    } catch (e) {
      console.warn("Expense create fallback", e);
    }
    const newExp: Expense = {
      id: `exp-${Date.now()}`,
      shop_id: expenseData.shop_id || MOCK_CURRENT_SHOP.id,
      title: expenseData.title || "Miscellaneous Expense",
      category: expenseData.category || "Misc",
      amount: expenseData.amount || 0,
      payment_method: expenseData.payment_method || "CASH",
      receipt_url: expenseData.receipt_url,
      expense_date: expenseData.expense_date || new Date().toISOString().split("T")[0],
      notes: expenseData.notes || "",
      created_at: new Date().toISOString(),
    };
    const current = getStoredOr(STORAGE_KEYS.EXPENSES, MOCK_EXPENSES);
    setStored(STORAGE_KEYS.EXPENSES, [newExp, ...current]);
    return newExp;
  },

  // ORDERS & POS BILLING
  async getOrders(shopId?: string): Promise<Order[]> {
    try {
      let query = supabase.from("orders").select("*, items:order_items(*, addons:order_item_addons(*))").order("created_at", { ascending: false });
      if (shopId) query = query.eq("shop_id", shopId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as Order[];
    } catch (e) {
      console.warn("Orders fallback", e);
    }
    return getStoredOr(STORAGE_KEYS.ORDERS, MOCK_ORDERS);
  },

  async createOrder(order: Order): Promise<Order> {
    try {
      const { data, error } = await supabase.from("orders").insert([{
        shop_id: order.shop_id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        order_type: order.order_type,
        subtotal: order.subtotal,
        tax_rate: order.tax_rate,
        tax_amount: order.tax_amount,
        discount_amount: order.discount_amount,
        total_amount: order.total_amount,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        status: order.status,
      }]).select().single();
      if (!error && data) {
        return { ...order, id: data.id };
      }
    } catch (e) {
      console.warn("Order insert fallback", e);
    }
    const current = getStoredOr(STORAGE_KEYS.ORDERS, MOCK_ORDERS);
    setStored(STORAGE_KEYS.ORDERS, [order, ...current]);
    return order;
  },

  // CASH REGISTER
  async getActiveRegister(shopId?: string): Promise<CashRegister> {
    try {
      let query = supabase.from("cash_registers").select("*").eq("status", "OPEN").order("opened_at", { ascending: false }).limit(1);
      if (shopId) query = query.eq("shop_id", shopId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data[0] as CashRegister;
    } catch (e) {
      console.warn("Register fallback", e);
    }
    return getStoredOr(STORAGE_KEYS.REGISTER, MOCK_CASH_REGISTER);
  },

  async updateRegister(register: CashRegister): Promise<void> {
    try {
      await supabase.from("cash_registers").update(register).eq("id", register.id);
    } catch (e) {
      console.warn("Register update fallback", e);
    }
    setStored(STORAGE_KEYS.REGISTER, register);
  },

  // EMPLOYEES & PROFILES
  async getEmployees(shopId?: string): Promise<Profile[]> {
    try {
      let query = supabase.from("profiles").select("*");
      if (shopId) query = query.eq("shop_id", shopId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as Profile[];
    } catch (e) {
      console.warn("Employees fallback", e);
    }
    return getStoredOr(STORAGE_KEYS.EMPLOYEES, MOCK_EMPLOYEES);
  },

  async createAdmin(adminData: Partial<Profile>): Promise<Profile> {
    try {
      const { data, error } = await supabase.from("profiles").insert([{
        ...adminData,
        role: "OWNER",
      }]).select().single();
      if (!error && data) return data as Profile;
    } catch (e) {
      console.warn("Admin create fallback", e);
    }
    const newAdmin: Profile = {
      id: `admin-${Date.now()}`,
      shop_id: adminData.shop_id || MOCK_CURRENT_SHOP.id,
      full_name: adminData.full_name || "Store Admin",
      email: adminData.email || "admin@chaicraft.in",
      phone: adminData.phone || "",
      address: adminData.address || "",
      country: adminData.country || "India",
      state: adminData.state || "Karnataka",
      district: adminData.district || "",
      role: "OWNER",
      is_active: true,
      monthly_salary: adminData.monthly_salary || 0,
      joining_date: new Date().toISOString().split("T")[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const current = getStoredOr(STORAGE_KEYS.EMPLOYEES, MOCK_EMPLOYEES);
    setStored(STORAGE_KEYS.EMPLOYEES, [...current, newAdmin]);
    return newAdmin;
  },

  async createEmployee(employeeData: Partial<Profile>): Promise<Profile> {
    try {
      const { data, error } = await supabase.from("profiles").insert([{
        ...employeeData,
        role: "EMPLOYEE",
      }]).select().single();
      if (!error && data) return data as Profile;
    } catch (e) {
      console.warn("Employee create fallback", e);
    }
    const newEmp: Profile = {
      id: `emp-${Date.now()}`,
      shop_id: employeeData.shop_id || MOCK_CURRENT_SHOP.id,
      full_name: employeeData.full_name || "Store Staff",
      email: employeeData.email || "staff@chaicraft.in",
      phone: employeeData.phone || "",
      address: employeeData.address || "",
      country: employeeData.country || "India",
      state: employeeData.state || "Karnataka",
      district: employeeData.district || "",
      role: "EMPLOYEE",
      is_active: true,
      monthly_salary: employeeData.monthly_salary || 0,
      joining_date: new Date().toISOString().split("T")[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const current = getStoredOr(STORAGE_KEYS.EMPLOYEES, MOCK_EMPLOYEES);
    setStored(STORAGE_KEYS.EMPLOYEES, [...current, newEmp]);
    return newEmp;
  },

  // DATEPAYS (DAILY OWNER INVESTMENT & RECONCILIATION)
  async getDatepays(shopId?: string): Promise<Datepay[]> {
    try {
      let query = supabase.from("datepays").select("*").order("date", { ascending: false });
      if (shopId) query = query.eq("shop_id", shopId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as Datepay[];
    } catch (e) {
      console.warn("Datepays fallback", e);
    }
    return getStoredOr(STORAGE_KEYS.DATEPAYS, MOCK_DATEPAYS);
  },

  async saveDatepay(datepayData: Partial<Datepay>): Promise<Datepay> {
    try {
      const { data, error } = await supabase.from("datepays").upsert([datepayData]).select().single();
      if (!error && data) return data as Datepay;
    } catch (e) {
      console.warn("Datepay save fallback", e);
    }
    const targetDate = datepayData.date || new Date().toISOString().split("T")[0];
    const current = getStoredOr(STORAGE_KEYS.DATEPAYS, MOCK_DATEPAYS);
    const existingIndex = current.findIndex((d) => d.date === targetDate);

    const updatedItem: Datepay = {
      id: datepayData.id || `dp-${Date.now()}`,
      shop_id: datepayData.shop_id || MOCK_CURRENT_SHOP.id,
      date: targetDate,
      investment_amount: datepayData.investment_amount || 0,
      total_billing_cash: datepayData.total_billing_cash || 0,
      total_billing_gpay: datepayData.total_billing_gpay || 0,
      total_billing: datepayData.total_billing || 0,
      total_expenses: datepayData.total_expenses || 0,
      calculated_balance: datepayData.calculated_balance || 0,
      actual_closing_cash: datepayData.actual_closing_cash,
      status: datepayData.status || "OPEN",
      notes: datepayData.notes || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let updatedList: Datepay[];
    if (existingIndex >= 0) {
      updatedList = [...current];
      updatedList[existingIndex] = { ...updatedList[existingIndex], ...updatedItem };
    } else {
      updatedList = [updatedItem, ...current];
    }
    setStored(STORAGE_KEYS.DATEPAYS, updatedList);
    return updatedItem;
  },

  async calculateDayMetrics(shopId: string, date: string): Promise<{
    billingCash: number;
    billingGpay: number;
    billingTotal: number;
    expensesTotal: number;
  }> {
    const orders = await this.getOrders(shopId);
    const expenses = await this.getExpenses(shopId);

    const dayOrders = orders.filter((o) => o.created_at.startsWith(date) && o.status === "COMPLETED");
    const dayExpenses = expenses.filter((e) => e.expense_date === date);

    let billingCash = 0;
    let billingGpay = 0;
    let billingTotal = 0;

    dayOrders.forEach((o) => {
      billingTotal += o.total_amount;
      if (o.payment_method === "CASH") {
        billingCash += o.total_amount;
      } else if (o.payment_method === "UPI_QR") {
        billingGpay += o.total_amount;
      } else if (o.payment_method === "SPLIT") {
        billingCash += o.cash_amount || 0;
        billingGpay += o.gpay_amount || 0;
      } else {
        billingCash += o.total_amount;
      }
    });

    const expensesTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      billingCash,
      billingGpay,
      billingTotal,
      expensesTotal,
    };
  },

  // SALARIES & ATTENDANCE
  async getSalaries(shopId?: string): Promise<Salary[]> {
    try {
      let query = supabase.from("salaries").select("*, employee:profiles(*)");
      if (shopId) query = query.eq("shop_id", shopId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as Salary[];
    } catch (e) {
      console.warn("Salaries fallback", e);
    }
    return getStoredOr(STORAGE_KEYS.SALARIES, MOCK_SALARIES);
  },

  async recordSalaryPayment(salaryData: Partial<Salary>): Promise<Salary> {
    try {
      const { data, error } = await supabase.from("salaries").upsert([salaryData]).select().single();
      if (!error && data) return data as Salary;
    } catch (e) {
      console.warn("Salary record fallback", e);
    }
    const current = getStoredOr(STORAGE_KEYS.SALARIES, MOCK_SALARIES);
    const newSalary: Salary = {
      id: salaryData.id || `sal-${Date.now()}`,
      shop_id: salaryData.shop_id || MOCK_CURRENT_SHOP.id,
      employee_id: salaryData.employee_id || "emp-1",
      month: salaryData.month || new Date().getMonth() + 1,
      year: salaryData.year || new Date().getFullYear(),
      base_salary: salaryData.base_salary || 0,
      allowances: salaryData.allowances || 0,
      bonus: salaryData.bonus || 0,
      advances_deducted: salaryData.advances_deducted || 0,
      other_deductions: salaryData.other_deductions || 0,
      net_payable: salaryData.net_payable || 0,
      paid_amount: salaryData.paid_amount || 0,
      payment_status: salaryData.payment_status || "PAID",
      payment_method: salaryData.payment_method || "UPI_QR",
      payment_date: salaryData.payment_date || new Date().toISOString().split("T")[0],
      notes: salaryData.notes,
      employee: salaryData.employee,
    };
    const updated = [newSalary, ...current.filter((s) => s.id !== newSalary.id)];
    setStored(STORAGE_KEYS.SALARIES, updated);
    return newSalary;
  },

  async getAttendance(shopId?: string): Promise<Attendance[]> {
    try {
      let query = supabase.from("attendance").select("*, employee:profiles(*)");
      if (shopId) query = query.eq("shop_id", shopId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as Attendance[];
    } catch (e) {
      console.warn("Attendance fallback", e);
    }
    return MOCK_ATTENDANCE;
  },
};
