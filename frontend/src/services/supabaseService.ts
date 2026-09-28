import { supabase, authRegistrationClient } from "@/lib/supabase";
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
  UserRole,
  Datepay,
  PaymentMethod,
  Purchase,
} from "@/types";
import {
  MOCK_CURRENT_SHOP,
  MOCK_SHOPS_LIST,
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  MOCK_INVENTORY,
  MOCK_SUPPLIERS,
  MOCK_EXPENSES,
  MOCK_PURCHASES,
  MOCK_ORDERS,
  MOCK_CASH_REGISTER,
  MOCK_EMPLOYEES,
  MOCK_SALARIES,
  MOCK_ATTENDANCE,
  MOCK_DATEPAYS,
} from "./mockData";
import { getLocalDateStr, isSameLocalDate } from "@/lib/utils";

// In-memory runtime cache keys (NO localStorage persistence except chaicraft_auth_session)
const STORAGE_KEYS = {
  SHOPS: "chaicraft_shops",
  CATEGORIES: "chaicraft_categories",
  PRODUCTS: "chaicraft_products",
  ORDERS: "chaicraft_orders",
  EXPENSES: "chaicraft_expenses",
  PURCHASES: "chaicraft_purchases",
  INVENTORY: "chaicraft_inventory",
  EMPLOYEES: "chaicraft_employees",
  SUPPLIERS: "chaicraft_suppliers",
  REGISTER: "chaicraft_register",
  DATEPAYS: "chaicraft_datepays",
  SALARIES: "chaicraft_salaries",
  ADDONS: "chaicraft_addons",
};

// In-memory runtime cache for data session (NO localStorage persistence except chaicraft_auth_session)
const memoryCache: Record<string, any> = {};

function getStoredOr<T>(key: string, fallback: T): T {
  return memoryCache[key] !== undefined ? memoryCache[key] : fallback;
}

function setStored<T>(key: string, value: T): void {
  // Store only in volatile memory during active app run, never in localStorage
  memoryCache[key] = value;
}

export const dataService = {
  // SHOPS
  async getShops(): Promise<Shop[]> {
    try {
      const { data, error } = await supabase.from("shops").select("*").order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          name: row.name || row.shop_name || "Artisan Chai Store",
          slug: row.slug || `shop-${row.id}`,
          shop_code: row.shop_code || `TEA-${String(row.id).slice(0, 5).toUpperCase()}`,
          tagline: row.tagline || "",
          address: row.address || "",
          country: row.country || "India",
          state: row.state || "",
          city: row.city || "",
          pincode: row.pincode || "",
          phone: row.phone || "",
          email: row.email || "",
          currency: row.currency || "INR",
          tax_rate: row.tax_rate ?? 5.0,
          subscription_status: row.subscription_status || "ACTIVE",
          subscription_start_date: row.subscription_start_date || row.start_date || row.created_at,
          subscription_end_date: row.subscription_end_date || row.expiry_date,
          start_date: row.start_date || row.created_at?.split("T")[0],
          expiry_date: row.expiry_date,
          is_lifetime: row.is_lifetime || false,
          logo_url: row.logo_url || row.shop_image || "",
          gpay_qr_url: row.gpay_qr_url || row.gpay_qr_image || "",
          gst_number: row.gst_number || "",
          is_active: row.is_active ?? true,
          created_at: row.created_at,
          updated_at: row.updated_at,
        })) as Shop[];
      }
    } catch (e) {
      console.warn("Supabase query fallback to mock", e);
    }
    return getStoredOr(STORAGE_KEYS.SHOPS, MOCK_SHOPS_LIST);
  },

  async createShop(shopData: Partial<Shop>): Promise<Shop> {
    const slug = (shopData.slug || shopData.name || `shop-${Date.now()}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const payload: Record<string, any> = {
      name: shopData.name,
      shop_name: shopData.name,
      slug: slug,
      shop_code: shopData.shop_code,
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
      subscription_status: shopData.subscription_status || "ACTIVE",
      start_date: shopData.start_date || new Date().toISOString().split("T")[0],
      expiry_date: shopData.is_lifetime ? null : shopData.expiry_date,
      is_lifetime: shopData.is_lifetime || false,
      logo_url: shopData.logo_url || "",
      shop_image: shopData.logo_url || "",
      gpay_qr_url: shopData.gpay_qr_url || "",
      gpay_qr_image: shopData.gpay_qr_url || "",
      gst_number: shopData.gst_number || "",
      is_active: shopData.is_active !== undefined ? shopData.is_active : true,
    };

    try {
      const { data, error } = await supabase.from("shops").insert([payload]).select().single();
      if (!error && data) {
        return {
          id: data.id,
          name: data.name || data.shop_name,
          slug: data.slug,
          shop_code: data.shop_code,
          tagline: data.tagline,
          address: data.address,
          country: data.country,
          state: data.state,
          city: data.city,
          pincode: data.pincode,
          phone: data.phone,
          email: data.email,
          currency: data.currency,
          tax_rate: data.tax_rate,
          subscription_status: data.subscription_status,
          start_date: data.start_date,
          expiry_date: data.expiry_date,
          is_lifetime: data.is_lifetime,
          logo_url: data.logo_url || data.shop_image,
          gpay_qr_url: data.gpay_qr_url || data.gpay_qr_image,
          gst_number: data.gst_number,
          is_active: data.is_active,
          created_at: data.created_at,
          updated_at: data.updated_at,
        } as Shop;
      }
      if (error) {
        console.error("Supabase createShop insert error:", error.message, error.details);
      }
    } catch (e) {
      console.warn("Supabase create fallback", e);
    }
    const newShop: Shop = {
      id: `shop-${Date.now()}`,
      name: shopData.name || "New Artisan Chai Shop",
      slug: slug,
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
  async getCategories(shopId?: string, onlyActive = false): Promise<Category[]> {
    try {
      let query = supabase.from("categories").select("*");
      if (shopId) query = query.eq("shop_id", shopId);
      if (onlyActive) query = query.eq("is_active", true);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (!error && data && data.length > 0) return data as Category[];
      if (error) {
        console.warn("Supabase getCategories error:", error.message);
      }
    } catch (e) {
      console.warn("Categories fallback", e);
    }
    const current = getStoredOr(STORAGE_KEYS.CATEGORIES, MOCK_CATEGORIES);
    if (onlyActive) return current.filter((c) => c.is_active);
    return current;
  },

  async createCategory(catData: Partial<Category>): Promise<Category> {
    try {
      const payload: any = {
        name: catData.name,
        description: catData.description || "",
        has_regular_thirsty: catData.has_regular_thirsty ?? false,
        regular_thirsty_types: catData.regular_thirsty_types || ["Regular", "Thirsty"],
        is_active: catData.is_active ?? true,
      };

      if (catData.shop_id) payload.shop_id = catData.shop_id;
      if (catData.slug) payload.slug = catData.slug;
      if (catData.sort_order !== undefined) payload.sort_order = catData.sort_order;

      const { data, error } = await supabase.from("categories").insert([payload]).select().single();
      if (!error && data) return data as Category;

      // If failed due to optional columns like 'slug' or 'sort_order' missing in DB table, retry with minimal fields
      if (error) {
        console.error("Supabase createCategory error:", error.message, error.details);
        if (error.message.includes("slug") || error.message.includes("sort_order")) {
          delete payload.slug;
          delete payload.sort_order;
          const retryRes = await supabase.from("categories").insert([payload]).select().single();
          if (!retryRes.error && retryRes.data) return retryRes.data as Category;
        }
      }
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
      is_active: catData.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const current = getStoredOr(STORAGE_KEYS.CATEGORIES, MOCK_CATEGORIES);
    setStored(STORAGE_KEYS.CATEGORIES, [...current, newCat]);
    return newCat;
  },

  async updateCategory(id: string, catData: Partial<Category>): Promise<Category> {
    try {
      const payload: any = {
        updated_at: new Date().toISOString(),
      };
      if (catData.name !== undefined) payload.name = catData.name;
      if (catData.description !== undefined) payload.description = catData.description;
      if (catData.has_regular_thirsty !== undefined) payload.has_regular_thirsty = catData.has_regular_thirsty;
      if (catData.regular_thirsty_types !== undefined) payload.regular_thirsty_types = catData.regular_thirsty_types;
      if (catData.is_active !== undefined) payload.is_active = catData.is_active;
      if (catData.shop_id !== undefined) payload.shop_id = catData.shop_id;
      if (catData.slug !== undefined) payload.slug = catData.slug;
      if (catData.sort_order !== undefined) payload.sort_order = catData.sort_order;

      const { data, error } = await supabase.from("categories").update(payload).eq("id", id).select().single();
      if (!error && data) return data as Category;
      if (error) {
        console.error("Supabase updateCategory error:", error.message, error.details);
      }
    } catch (e) {
      console.warn("Category update fallback", e);
    }
    const current = getStoredOr(STORAGE_KEYS.CATEGORIES, MOCK_CATEGORIES);
    const updated = current.map((c) => (c.id === id ? { ...c, ...catData, updated_at: new Date().toISOString() } : c));
    setStored(STORAGE_KEYS.CATEGORIES, updated);
    return updated.find((c) => c.id === id) as Category;
  },

  async deleteCategory(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (!error) {
        const current = getStoredOr(STORAGE_KEYS.CATEGORIES, MOCK_CATEGORIES);
        setStored(STORAGE_KEYS.CATEGORIES, current.filter((c) => c.id !== id));
        return true;
      }
      console.error("Supabase deleteCategory error:", error);
    } catch (e) {
      console.warn("Category delete fallback", e);
    }
    const current = getStoredOr(STORAGE_KEYS.CATEGORIES, MOCK_CATEGORIES);
    setStored(STORAGE_KEYS.CATEGORIES, current.filter((c) => c.id !== id));
    return true;
  },

  // ADDONS
  async getAddons(shopId?: string): Promise<{ id: string; name: string; price: number; is_available: boolean }[]> {
    try {
      let query = supabase.from("addons").select("*").eq("is_available", true);
      if (shopId) query = query.eq("shop_id", shopId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn("Addons fallback", e);
    }
    return getStoredOr(STORAGE_KEYS.ADDONS, []);
  },

  // PRODUCTS
  async getProducts(shopId?: string, onlyAvailable = false): Promise<Product[]> {
    try {
      let query = supabase.from("products").select("*, variants:product_variants(*)");
      if (shopId) query = query.eq("shop_id", shopId);
      if (onlyAvailable) query = query.eq("is_available", true);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          ...row,
          is_active: row.is_active ?? row.is_available ?? true,
          is_available: row.is_available ?? true,
          track_stock: row.stock_quantity !== null && row.stock_quantity !== undefined,
          is_unlimited: row.stock_quantity === null || row.stock_quantity === undefined,
        })) as Product[];
      }
    } catch (e) {
      console.warn("Products fallback", e);
    }
    const current = getStoredOr<Product[]>(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
    if (onlyAvailable) return current.filter((p) => p.is_available !== false && p.is_active !== false);
    return current;
  },

  async getProductById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase.from("products").select("*, variants:product_variants(*)").eq("id", id).single();
      if (!error && data) {
        return {
          ...data,
          is_active: data.is_active ?? data.is_available ?? true,
          is_available: data.is_available ?? true,
          track_stock: data.stock_quantity !== null && data.stock_quantity !== undefined,
          is_unlimited: data.stock_quantity === null || data.stock_quantity === undefined,
        } as Product;
      }
    } catch (e) {
      console.warn("getProductById fallback", e);
    }
    const current = getStoredOr<Product[]>(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
    return current.find((p) => p.id === id) || null;
  },

  async createProduct(productData: Partial<Product>): Promise<Product> {
    try {
      const { variants, ...rest } = productData;
      const payload: any = {
        name: rest.name,
        category_id: rest.category_id || null,
        description: rest.description || "",
        unit_mode: rest.unit_mode || "QTY",
        weight_unit: rest.weight_unit || "GM",
        stock_quantity: rest.track_stock === false ? null : (rest.stock_quantity ?? 100),
        available_weight: rest.available_weight ?? 0,
        price_mode: rest.price_mode || "STANDARD",
        regular_price: rest.regular_price || 0,
        thirsty_price: rest.thirsty_price || 0,
        base_price: rest.base_price || 0,
        cost_price: rest.cost_price || 0,
        image_url: rest.image_url || null,
        is_available: rest.is_available !== false,
      };
      if (rest.shop_id) payload.shop_id = rest.shop_id;
      if (rest.sku) payload.sku = rest.sku;
      if (rest.preparation_time_minutes) payload.preparation_time_minutes = rest.preparation_time_minutes;

      const { data, error } = await supabase.from("products").insert([payload]).select().single();
      if (!error && data) {
        let insertedVariants: any[] = [];
        if (variants && variants.length > 0) {
          const varRows = variants.map((v) => ({
            product_id: data.id,
            shop_id: data.shop_id,
            name: v.name,
            price: v.price,
            cost_price: v.cost_price || 0,
            is_default: v.is_default ?? false,
          }));
          const { data: vData } = await supabase.from("product_variants").insert(varRows).select();
          if (vData) insertedVariants = vData;
        }
        return {
          ...data,
          track_stock: data.stock_quantity !== null && data.stock_quantity !== undefined,
          is_unlimited: data.stock_quantity === null || data.stock_quantity === undefined,
          variants: insertedVariants.length > 0 ? insertedVariants : variants || [],
        } as Product;
      }
      if (error) {
        console.error("Supabase createProduct error:", error.message, error.details);
      }
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
      track_stock: productData.track_stock,
      is_unlimited: productData.track_stock === false,
      stock_quantity: productData.track_stock === false ? undefined : (productData.stock_quantity ?? 100),
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

  async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    try {
      const { variants, ...rest } = productData;
      const payload: any = {
        updated_at: new Date().toISOString(),
      };

      if (rest.name !== undefined) payload.name = rest.name;
      if (rest.category_id !== undefined) payload.category_id = rest.category_id || null;
      if (rest.description !== undefined) payload.description = rest.description || "";
      if (rest.unit_mode !== undefined) payload.unit_mode = rest.unit_mode;
      if (rest.weight_unit !== undefined) payload.weight_unit = rest.weight_unit;
      
      // Stock quantity handling: If track_stock is false, explicitly set to null in DB
      if (rest.track_stock !== undefined) {
        payload.stock_quantity = rest.track_stock === false ? null : (rest.stock_quantity !== undefined ? rest.stock_quantity : null);
      } else if (rest.stock_quantity !== undefined) {
        payload.stock_quantity = rest.stock_quantity;
      }

      if (rest.available_weight !== undefined) payload.available_weight = rest.available_weight;
      if (rest.price_mode !== undefined) payload.price_mode = rest.price_mode;
      if (rest.regular_price !== undefined) payload.regular_price = rest.regular_price;
      if (rest.thirsty_price !== undefined) payload.thirsty_price = rest.thirsty_price;
      if (rest.base_price !== undefined) payload.base_price = rest.base_price;
      if (rest.cost_price !== undefined) payload.cost_price = rest.cost_price;
      if (rest.image_url !== undefined) payload.image_url = rest.image_url;
      if (rest.is_available !== undefined) payload.is_available = rest.is_available;
      if (rest.sku !== undefined) payload.sku = rest.sku;
      if (rest.preparation_time_minutes !== undefined) payload.preparation_time_minutes = rest.preparation_time_minutes;

      const { data, error } = await supabase.from("products").update(payload).eq("id", id).select().single();
      if (error) {
        console.error("Supabase updateProduct error:", error.message, error.details);
      }
      if (!error && data) {
        if (variants && variants.length > 0) {
          await supabase.from("product_variants").delete().eq("product_id", id);
          const varRows = variants.map((v) => ({
            product_id: id,
            shop_id: data.shop_id,
            name: v.name,
            price: v.price,
            cost_price: v.cost_price || 0,
            is_default: v.is_default ?? false,
          }));
          const { data: vData } = await supabase.from("product_variants").insert(varRows).select();
          return {
            ...data,
            track_stock: data.stock_quantity !== null && data.stock_quantity !== undefined,
            is_unlimited: data.stock_quantity === null || data.stock_quantity === undefined,
            variants: vData || variants,
          } as Product;
        }
        return {
          ...data,
          track_stock: data.stock_quantity !== null && data.stock_quantity !== undefined,
          is_unlimited: data.stock_quantity === null || data.stock_quantity === undefined,
        } as Product;
      }
    } catch (e) {
      console.warn("Product update fallback", e);
    }
    const current = getStoredOr<Product[]>(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
    const updated = current.map((p) => (p.id === id ? { ...p, ...productData, updated_at: new Date().toISOString() } : p));
    setStored(STORAGE_KEYS.PRODUCTS, updated);
    return updated.find((p) => p.id === id) || (productData as Product);
  },

  async updateProductStock(id: string, newStock: number, availableWeight?: number): Promise<Product> {
    return this.updateProduct(id, {
      stock_quantity: newStock,
      available_weight: availableWeight,
      track_stock: true,
    });
  },

  async updateProductStatus(id: string, isAvailable: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_available: isAvailable, is_active: isAvailable, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (!error) {
        const current = getStoredOr<Product[]>(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
        const updated = current.map((p) => (p.id === id ? { ...p, is_available: isAvailable, is_active: isAvailable } : p));
        setStored(STORAGE_KEYS.PRODUCTS, updated);
        return true;
      }
      if (error) {
        console.error("Supabase updateProductStatus error:", error.message);
      }
    } catch (e) {
      console.warn("updateProductStatus fallback", e);
    }
    const current = getStoredOr<Product[]>(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
    const updated = current.map((p) => (p.id === id ? { ...p, is_available: isAvailable, is_active: isAvailable } : p));
    setStored(STORAGE_KEYS.PRODUCTS, updated);
    return true;
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (!error) {
        const current = getStoredOr<Product[]>(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
        setStored(STORAGE_KEYS.PRODUCTS, current.filter((p) => p.id !== id));
        return true;
      }
    } catch (e) {
      console.warn("Product delete fallback", e);
    }
    const current = getStoredOr<Product[]>(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
    setStored(STORAGE_KEYS.PRODUCTS, current.filter((p) => p.id !== id));
    return true;
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
  async getSuppliers(shopId?: string, onlyActive = false): Promise<Supplier[]> {
    try {
      let query = supabase.from("suppliers").select("*");
      if (shopId) query = query.eq("shop_id", shopId);
      if (onlyActive) query = query.eq("is_active", true);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          ...row,
          company_name: row.company_name || row.name,
          company_address: row.company_address || row.address,
          company_phone: row.company_phone || row.phone,
          product_name: row.product_name || row.notes || "",
        })) as Supplier[];
      }
      if (error) {
        console.warn("Supabase getSuppliers error:", error.message);
      }
    } catch (e) {
      console.warn("Suppliers fallback", e);
    }
    const current = getStoredOr<Supplier[]>(STORAGE_KEYS.SUPPLIERS, MOCK_SUPPLIERS);
    if (onlyActive) return current.filter((s) => s.is_active !== false);
    return current;
  },

  async createSupplier(supData: Partial<Supplier>): Promise<Supplier> {
    const targetShopId = supData.shop_id || MOCK_CURRENT_SHOP.id;
    const companyName = supData.company_name || supData.name || "Unnamed Supplier";
    const companyAddress = supData.company_address || supData.address || "";
    const companyPhone = supData.company_phone || supData.phone || "";
    const productName = supData.product_name || supData.notes || "";

    const payload: any = {
      shop_id: targetShopId,
      name: companyName,
      contact_person: supData.contact_person || "",
      phone: companyPhone,
      email: supData.email || "",
      address: companyAddress,
      notes: productName,
      payment_terms: supData.payment_terms || "Net 15",
      is_active: supData.is_active ?? true,
    };

    try {
      const { data, error } = await supabase.from("suppliers").insert([payload]).select().single();
      if (!error && data) {
        const fullSupplier: Supplier = {
          ...data,
          company_name: data.company_name || data.name,
          company_address: data.company_address || data.address,
          company_phone: data.company_phone || data.phone,
          product_name: data.product_name || data.notes || productName,
        };
        const current = getStoredOr<Supplier[]>(STORAGE_KEYS.SUPPLIERS, MOCK_SUPPLIERS);
        setStored(STORAGE_KEYS.SUPPLIERS, [fullSupplier, ...current]);
        return fullSupplier;
      }
      if (error) {
        console.error("Supabase createSupplier error:", error.message, error.details);
      }
    } catch (e) {
      console.warn("Supplier create fallback", e);
    }

    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      shop_id: targetShopId,
      name: companyName,
      company_name: companyName,
      product_name: productName,
      contact_person: supData.contact_person || "",
      phone: companyPhone,
      company_phone: companyPhone,
      email: supData.email || "",
      address: companyAddress,
      company_address: companyAddress,
      payment_terms: supData.payment_terms || "Net 15",
      is_active: supData.is_active ?? true,
      created_at: new Date().toISOString(),
    };
    const current = getStoredOr<Supplier[]>(STORAGE_KEYS.SUPPLIERS, MOCK_SUPPLIERS);
    setStored(STORAGE_KEYS.SUPPLIERS, [newSup, ...current]);
    return newSup;
  },

  async updateSupplier(id: string, supData: Partial<Supplier>): Promise<Supplier> {
    const payload: any = {
      updated_at: new Date().toISOString(),
    };
    if (supData.name !== undefined || supData.company_name !== undefined) {
      payload.name = supData.company_name || supData.name;
    }
    if (supData.contact_person !== undefined) payload.contact_person = supData.contact_person;
    if (supData.phone !== undefined || supData.company_phone !== undefined) {
      payload.phone = supData.company_phone || supData.phone;
    }
    if (supData.email !== undefined) payload.email = supData.email;
    if (supData.address !== undefined || supData.company_address !== undefined) {
      payload.address = supData.company_address || supData.address;
    }
    if (supData.notes !== undefined || supData.product_name !== undefined) {
      payload.notes = supData.product_name || supData.notes;
    }
    if (supData.payment_terms !== undefined) payload.payment_terms = supData.payment_terms;
    if (supData.is_active !== undefined) payload.is_active = supData.is_active;

    try {
      const { data, error } = await supabase.from("suppliers").update(payload).eq("id", id).select().single();
      if (!error && data) {
        const fullSupplier: Supplier = {
          ...data,
          company_name: data.company_name || data.name,
          company_address: data.company_address || data.address,
          company_phone: data.company_phone || data.phone,
          product_name: data.product_name || data.notes || supData.product_name,
        };
        const current = getStoredOr<Supplier[]>(STORAGE_KEYS.SUPPLIERS, MOCK_SUPPLIERS);
        const updated = current.map((s) => (s.id === id ? { ...s, ...fullSupplier } : s));
        setStored(STORAGE_KEYS.SUPPLIERS, updated);
        return fullSupplier;
      }
      if (error) {
        console.error("Supabase updateSupplier error:", error.message);
      }
    } catch (e) {
      console.warn("Supplier update fallback", e);
    }

    const current = getStoredOr<Supplier[]>(STORAGE_KEYS.SUPPLIERS, MOCK_SUPPLIERS);
    const updated = current.map((s) => (s.id === id ? { ...s, ...supData, updated_at: new Date().toISOString() } : s));
    setStored(STORAGE_KEYS.SUPPLIERS, updated);
    return updated.find((s) => s.id === id) as Supplier;
  },

  async updateSupplierStatus(id: string, isActive: boolean): Promise<boolean> {
    try {
      const { error } = await supabase.from("suppliers").update({ is_active: isActive, updated_at: new Date().toISOString() }).eq("id", id);
      if (!error) {
        const current = getStoredOr<Supplier[]>(STORAGE_KEYS.SUPPLIERS, MOCK_SUPPLIERS);
        const updated = current.map((s) => (s.id === id ? { ...s, is_active: isActive } : s));
        setStored(STORAGE_KEYS.SUPPLIERS, updated);
        return true;
      }
      console.error("Supabase updateSupplierStatus error:", error);
    } catch (e) {
      console.warn("Supplier status update fallback", e);
    }
    const current = getStoredOr<Supplier[]>(STORAGE_KEYS.SUPPLIERS, MOCK_SUPPLIERS);
    const updated = current.map((s) => (s.id === id ? { ...s, is_active: isActive } : s));
    setStored(STORAGE_KEYS.SUPPLIERS, updated);
    return true;
  },

  async deleteSupplier(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (!error) {
        const current = getStoredOr<Supplier[]>(STORAGE_KEYS.SUPPLIERS, MOCK_SUPPLIERS);
        setStored(STORAGE_KEYS.SUPPLIERS, current.filter((s) => s.id !== id));
        return true;
      }
    } catch (e) {
      console.warn("Supplier delete fallback", e);
    }
    const current = getStoredOr<Supplier[]>(STORAGE_KEYS.SUPPLIERS, MOCK_SUPPLIERS);
    setStored(STORAGE_KEYS.SUPPLIERS, current.filter((s) => s.id !== id));
    return true;
  },

  // EXPENSES
  async getExpenses(shopId?: string): Promise<Expense[]> {
    try {
      let query = supabase.from("expenses").select("*, user:user_id(id, name, email)").order("expense_date", { ascending: false }).order("created_at", { ascending: false });
      if (shopId) query = query.eq("shop_id", shopId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as Expense[];

      // Fallback query if foreign key user join is not mapped yet
      if (error) {
        let fallbackQuery = supabase.from("expenses").select("*").order("expense_date", { ascending: false });
        if (shopId) fallbackQuery = fallbackQuery.eq("shop_id", shopId);
        const { data: fbData, error: fbErr } = await fallbackQuery;
        if (!fbErr && fbData && fbData.length > 0) return fbData as Expense[];
      }
    } catch (e) {
      console.warn("Expenses fallback", e);
    }
    return getStoredOr(STORAGE_KEYS.EXPENSES, []);
  },

  async createExpense(expenseData: Partial<Expense>): Promise<Expense> {
    const amountVal = parseFloat(String(expenseData.amount)) || 0;
    const billAmountVal = parseFloat(String(expenseData.bill_amount)) || 0;
    const balanceAmountVal = expenseData.balance_amount !== undefined 
      ? parseFloat(String(expenseData.balance_amount)) 
      : (amountVal - billAmountVal);
    const statusVal = expenseData.status || (billAmountVal > 0 ? "COMPLETED" : "PENDING");

    const payload: any = {
      shop_id: expenseData.shop_id || MOCK_CURRENT_SHOP.id,
      user_id: expenseData.user_id || expenseData.created_by || null,
      created_by: expenseData.user_id || expenseData.created_by || null,
      title: expenseData.title || "Store Expense",
      category: expenseData.category || "Misc",
      amount: amountVal,
      bill_amount: billAmountVal,
      balance_amount: balanceAmountVal,
      payment_method: expenseData.payment_method || "CASH",
      expense_date: expenseData.expense_date || new Date().toISOString().split("T")[0],
      receipt_url: expenseData.receipt_url || null,
      notes: expenseData.notes || "",
      status: statusVal,
    };

    try {
      const { data, error } = await supabase.from("expenses").insert([payload]).select().single();
      if (!error && data) return data as Expense;
      if (error) {
        console.warn("Expense insert full payload error, trying base columns:", error.message);
        const basePayload: any = {
          shop_id: payload.shop_id,
          title: payload.title,
          category: payload.category,
          amount: payload.amount,
          payment_method: payload.payment_method,
          expense_date: payload.expense_date,
          receipt_url: payload.receipt_url,
          notes: payload.notes,
        };
        const { data: baseData, error: baseErr } = await supabase.from("expenses").insert([basePayload]).select().single();
        if (!baseErr && baseData) return { ...baseData, ...payload } as Expense;
      }
    } catch (e) {
      console.warn("Expense create fallback", e);
    }
    const newExp: Expense = {
      id: `exp-${Date.now()}`,
      ...payload,
      created_at: new Date().toISOString(),
    };
    const current = getStoredOr(STORAGE_KEYS.EXPENSES, []);
    setStored(STORAGE_KEYS.EXPENSES, [newExp, ...current]);
    return newExp;
  },

  async updateExpense(id: string, expenseData: Partial<Expense>): Promise<Expense> {
    const amountVal = expenseData.amount !== undefined ? parseFloat(String(expenseData.amount)) : undefined;
    const billAmountVal = expenseData.bill_amount !== undefined ? parseFloat(String(expenseData.bill_amount)) : undefined;
    let balanceAmountVal = expenseData.balance_amount;
    if (balanceAmountVal === undefined && amountVal !== undefined && billAmountVal !== undefined) {
      balanceAmountVal = amountVal - billAmountVal;
    }

    const payload: any = {
      ...expenseData,
      updated_at: new Date().toISOString(),
    };
    if (amountVal !== undefined) payload.amount = amountVal;
    if (billAmountVal !== undefined) payload.bill_amount = billAmountVal;
    if (balanceAmountVal !== undefined) payload.balance_amount = balanceAmountVal;

    try {
      const { data, error } = await supabase.from("expenses").update(payload).eq("id", id).select().single();
      if (!error && data) return data as Expense;
      if (error) {
        console.warn("Expense update error:", error.message);
      }
    } catch (e) {
      console.warn("Expense update fallback", e);
    }

    const current = getStoredOr<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    const updated = current.map((item) => (item.id === id ? { ...item, ...payload } : item));
    setStored(STORAGE_KEYS.EXPENSES, updated);
    return updated.find((item) => item.id === id) || (payload as Expense);
  },

  async deleteExpense(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (!error) {
        const current = getStoredOr<Expense[]>(STORAGE_KEYS.EXPENSES, []);
        setStored(STORAGE_KEYS.EXPENSES, current.filter((e) => e.id !== id));
        return true;
      }
    } catch (e) {
      console.warn("Expense delete fallback", e);
    }
    const current = getStoredOr<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    setStored(STORAGE_KEYS.EXPENSES, current.filter((e) => e.id !== id));
    return true;
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
      const orderPayload: any = {
        shop_id: order.shop_id,
        order_number: order.order_number,
        cashier_id: order.cashier_id || null,
        cashier_name: order.cashier_name || null,
        customer_name: order.customer_name || "Walk-in Guest",
        customer_phone: order.customer_phone || null,
        order_type: order.order_type,
        subtotal: order.subtotal,
        tax_rate: order.tax_rate,
        tax_amount: order.tax_amount,
        discount_amount: order.discount_amount,
        discount_reason: order.discount_reason || null,
        total_amount: order.total_amount,
        received_amount: order.received_amount !== undefined ? order.received_amount : order.total_amount,
        balance_amount: order.balance_amount !== undefined ? order.balance_amount : 0.00,
        payment_method: order.payment_method,
        cash_amount: order.cash_amount || (order.payment_method === "CASH" ? order.total_amount : 0),
        gpay_amount: order.gpay_amount || (order.payment_method === "UPI_QR" ? order.total_amount : 0),
        is_split_payment: order.is_split_payment || order.payment_method === "SPLIT",
        payment_status: order.payment_status,
        status: order.status,
      };

      let { data, error } = await supabase.from("orders").insert([orderPayload]).select().single();
      if (error && (error.message?.includes("received_amount") || error.message?.includes("balance_amount") || error.message?.includes("cashier_name"))) {
        // Fallback without new columns if migration not yet run
        const legacyPayload = { ...orderPayload };
        delete legacyPayload.received_amount;
        delete legacyPayload.balance_amount;
        delete legacyPayload.cashier_name;
        const retry = await supabase.from("orders").insert([legacyPayload]).select().single();
        data = retry.data;
        error = retry.error;
      }
      if (!error && data) {
        const orderId = data.id;
        // Insert order items if present
        if (order.items && order.items.length > 0) {
          const itemPayloads = order.items.map((item) => ({
            order_id: orderId,
            product_id: item.product_id || null,
            variant_id: item.variant_id || null,
            product_name: item.product_name,
            variant_name: item.variant_name || null,
            size_variant: item.size_variant || null,
            unit_mode: item.unit_mode || "QTY",
            weight_grams: item.weight_grams || null,
            weight_kg: item.weight_kg || null,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal,
          }));
          await supabase.from("order_items").insert(itemPayloads);

          // Deduct stock for tracked items
          for (const item of order.items) {
            if (item.product_id) {
              await this.deductProductStock(item.product_id, item.quantity);
            }
          }
        }
        return { ...order, id: orderId };
      }
    } catch (e) {
      console.warn("Order insert fallback", e);
    }
    const current = getStoredOr(STORAGE_KEYS.ORDERS, MOCK_ORDERS);
    setStored(STORAGE_KEYS.ORDERS, [order, ...current]);

    // Deduct stock in fallback local storage
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        if (item.product_id) {
          await this.deductProductStock(item.product_id, item.quantity);
        }
      }
    }
    return order;
  },

  async deductProductStock(productId: string, quantity: number): Promise<void> {
    try {
      const { data: prod, error } = await supabase.from("products").select("id, stock_quantity").eq("id", productId).single();
      if (!error && prod && prod.stock_quantity !== null && prod.stock_quantity !== undefined) {
        const curStock = parseFloat(String(prod.stock_quantity));
        if (!isNaN(curStock)) {
          const newStock = Math.max(0, curStock - quantity);
          await supabase.from("products").update({ stock_quantity: newStock, updated_at: new Date().toISOString() }).eq("id", productId);
        }
      }
    } catch (e) {
      console.warn("Product stock deduction in supabase fallback", e);
    }
    const currentProds = getStoredOr<Product[]>(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
    const updatedProds = currentProds.map((p) => {
      if (p.id === productId && p.stock_quantity !== null && p.stock_quantity !== undefined) {
        const cur = parseFloat(String(p.stock_quantity));
        if (!isNaN(cur)) {
          return { ...p, stock_quantity: Math.max(0, cur - quantity) };
        }
      }
      return p;
    });
    setStored(STORAGE_KEYS.PRODUCTS, updatedProds);
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
      let query = supabase.from("users").select("*");
      if (shopId) query = query.eq("shop_id", shopId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          shop_id: row.shop_id ?? undefined,
          full_name: row.name || row.full_name || "Staff Member",
          email: row.email,
          phone: row.phone ?? undefined,
          password: row.password_hash || row.password || "",
          password_hash: row.password_hash || row.password || "",
          address: row.address ?? undefined,
          country: row.country ?? undefined,
          state: row.state ?? undefined,
          district: row.district ?? undefined,
          role: row.role as UserRole,
          monthly_salary: row.salary ?? row.monthly_salary ?? 0,
          is_active: row.is_active ?? true,
          created_at: row.created_at || new Date().toISOString(),
          updated_at: row.updated_at || new Date().toISOString(),
        })) as Profile[];
      }
    } catch (e) {
      console.warn("Users query fallback", e);
    }
    const current = getStoredOr<Profile[]>(STORAGE_KEYS.EMPLOYEES, MOCK_EMPLOYEES);
    if (shopId) return current.filter((e) => e.shop_id === shopId);
    return current;
  },

  async updateUserStatus(userId: string, isActive: boolean): Promise<boolean> {
    try {
      const { error } = await supabase.from("users").update({ is_active: isActive }).eq("id", userId);
      if (!error) {
        const current = getStoredOr<Profile[]>(STORAGE_KEYS.EMPLOYEES, MOCK_EMPLOYEES);
        const updated = current.map((u) => (u.id === userId ? { ...u, is_active: isActive } : u));
        setStored(STORAGE_KEYS.EMPLOYEES, updated);
        return true;
      }
      console.warn("Supabase user status update notice:", error.message);
    } catch (e) {
      console.warn("User status update error", e);
    }
    const current = getStoredOr<Profile[]>(STORAGE_KEYS.EMPLOYEES, MOCK_EMPLOYEES);
    const updated = current.map((u) => (u.id === userId ? { ...u, is_active: isActive } : u));
    setStored(STORAGE_KEYS.EMPLOYEES, updated);
    return true;
  },

  async createAdmin(adminData: Partial<Profile>): Promise<Profile> {
    const password = adminData.password || "Chai@123456";
    const cleanEmail = (adminData.email || "").trim().toLowerCase();
    let authUserId: string | undefined;

    // 1. Create user in Supabase Auth (auth.users)
    try {
      const { data: authData, error: authError } = await authRegistrationClient.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            name: adminData.full_name || "Store Admin",
            role: adminData.role || "OWNER",
            shop_id: adminData.shop_id || null,
            phone: adminData.phone || null,
          },
        },
      });

      if (authError) {
        console.warn("Supabase Auth registration notice (Admin):", authError.message);
      } else if (authData?.user?.id) {
        authUserId = authData.user.id;
      }
    } catch (authErr) {
      console.warn("Supabase Auth signup call warning:", authErr);
    }

    // 2. Insert / upsert into `public.users` table
    try {
      const userPayload: Record<string, any> = {
        shop_id: adminData.shop_id || null,
        name: adminData.full_name || "Store Admin",
        email: cleanEmail,
        phone: adminData.phone || null,
        address: adminData.address || null,
        password_hash: password || null,
        role: adminData.role || "OWNER",
        salary: adminData.monthly_salary || 0,
        country: adminData.country || null,
        state: adminData.state || null,
        district: adminData.district || null,
        is_active: true,
      };

      if (authUserId) {
        userPayload.id = authUserId;
      }

      let { data, error } = await supabase
        .from("users")
        .upsert([userPayload], { onConflict: "email" })
        .select()
        .single();

      // If database enum does not have 'OWNER' yet, retry with 'ADMIN'
      if (error && error.message?.includes("enum user_role")) {
        console.warn("Retrying with role 'ADMIN' due to enum restriction");
        userPayload.role = "ADMIN";
        const retryResult = await supabase
          .from("users")
          .upsert([userPayload], { onConflict: "email" })
          .select()
          .single();
        data = retryResult.data;
        error = retryResult.error;
      }

      if (!error && data) {
        return {
          id: data.id,
          shop_id: data.shop_id,
          full_name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          country: data.country,
          state: data.state,
          district: data.district,
          role: data.role,
          monthly_salary: data.salary,
          is_active: data.is_active,
          created_at: data.created_at,
          updated_at: data.updated_at,
        } as Profile;
      }
      if (error) {
        console.error("Users table createAdmin error:", error.message);
      }
    } catch (e) {
      console.warn("Users table insert fallback", e);
    }

    const newAdmin: Profile = {
      id: authUserId || `admin-${Date.now()}`,
      shop_id: adminData.shop_id || MOCK_CURRENT_SHOP.id,
      full_name: adminData.full_name || "Store Admin",
      email: cleanEmail || "admin@chaicraft.in",
      phone: adminData.phone || "",
      address: adminData.address || "",
      country: adminData.country || "India",
      state: adminData.state || "Karnataka",
      district: adminData.district || "",
      role: adminData.role || "OWNER",
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
    const password = employeeData.password || "Chai@123456";
    const cleanEmail = (employeeData.email || "").trim().toLowerCase();
    let authUserId: string | undefined;

    // 1. Create user in Supabase Auth (auth.users)
    try {
      const { data: authData, error: authError } = await authRegistrationClient.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            name: employeeData.full_name || "Store Staff",
            role: employeeData.role || "EMPLOYEE",
            shop_id: employeeData.shop_id || null,
            phone: employeeData.phone || null,
          },
        },
      });

      if (authError) {
        console.warn("Supabase Auth registration notice (Employee):", authError.message);
      } else if (authData?.user?.id) {
        authUserId = authData.user.id;
      }
    } catch (authErr) {
      console.warn("Supabase Auth signup call warning:", authErr);
    }

    // 2. Insert / upsert into `public.users` table
    try {
      const userPayload: Record<string, any> = {
        shop_id: employeeData.shop_id || null,
        name: employeeData.full_name || "Store Staff",
        email: cleanEmail,
        phone: employeeData.phone || null,
        address: employeeData.address || null,
        password_hash: password || null,
        role: employeeData.role || "EMPLOYEE",
        salary: employeeData.monthly_salary || 0,
        country: employeeData.country || null,
        state: employeeData.state || null,
        district: employeeData.district || null,
        is_active: true,
      };

      if (authUserId) {
        userPayload.id = authUserId;
      }

      const { data, error } = await supabase
        .from("users")
        .upsert([userPayload], { onConflict: "email" })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          shop_id: data.shop_id,
          full_name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          country: data.country,
          state: data.state,
          district: data.district,
          role: data.role,
          monthly_salary: data.salary,
          is_active: data.is_active,
          created_at: data.created_at,
          updated_at: data.updated_at,
        } as Profile;
      }
      if (error) {
        console.error("Users table createEmployee error:", error.message);
      }
    } catch (e) {
      console.warn("Users table insert fallback", e);
    }

    const newEmp: Profile = {
      id: authUserId || `emp-${Date.now()}`,
      shop_id: employeeData.shop_id || MOCK_CURRENT_SHOP.id,
      full_name: employeeData.full_name || "Store Staff",
      email: cleanEmail || "staff@chaicraft.in",
      phone: employeeData.phone || "",
      address: employeeData.address || "",
      country: employeeData.country || "India",
      state: employeeData.state || "Karnataka",
      district: employeeData.district || "",
      role: employeeData.role || "EMPLOYEE",
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

  async getTodayDatepay(shopId?: string, dateStr?: string): Promise<Datepay | null> {
    const targetDate = dateStr || getLocalDateStr(new Date());
    try {
      let query = supabase.from("datepays").select("*").eq("date", targetDate);
      if (shopId) query = query.eq("shop_id", shopId);
      const { data, error } = await query.order("created_at", { ascending: false }).limit(1);
      if (!error && data && data.length > 0) return data[0] as Datepay;
    } catch (e) {
      console.warn("getTodayDatepay fallback", e);
    }
    const current = getStoredOr<Datepay[]>(STORAGE_KEYS.DATEPAYS, MOCK_DATEPAYS);
    const found = current.find((d) => isSameLocalDate(d.date, targetDate) && (!shopId || d.shop_id === shopId));
    return found || null;
  },

  async saveDatepay(datepayData: Partial<Datepay>): Promise<Datepay> {
    const targetDate = datepayData.date || getLocalDateStr(new Date());
    const shopId = datepayData.shop_id || MOCK_CURRENT_SHOP.id;

    const payload: any = {
      shop_id: shopId,
      date: targetDate,
      investment_amount: datepayData.investment_amount !== undefined ? Number(datepayData.investment_amount) : 0,
      total_billing_cash: datepayData.total_billing_cash !== undefined ? Number(datepayData.total_billing_cash) : 0,
      total_billing_gpay: datepayData.total_billing_gpay !== undefined ? Number(datepayData.total_billing_gpay) : 0,
      total_billing: datepayData.total_billing !== undefined ? Number(datepayData.total_billing) : 0,
      total_expenses: datepayData.total_expenses !== undefined ? Number(datepayData.total_expenses) : 0,
      calculated_balance: datepayData.calculated_balance !== undefined ? Number(datepayData.calculated_balance) : 0,
      actual_closing_cash: datepayData.actual_closing_cash !== undefined ? Number(datepayData.actual_closing_cash) : null,
      status: datepayData.status || "OPEN",
      notes: datepayData.notes || "",
      updated_at: new Date().toISOString(),
    };
    if (datepayData.id) {
      payload.id = datepayData.id;
    }

    try {
      const { data, error } = await supabase
        .from("datepays")
        .upsert([payload], { onConflict: "id" })
        .select()
        .single();
      if (!error && data) {
        // Sync local storage as well
        const current = getStoredOr<Datepay[]>(STORAGE_KEYS.DATEPAYS, MOCK_DATEPAYS);
        const existingIdx = current.findIndex((d) => d.date === targetDate && d.shop_id === shopId);
        let updatedList: Datepay[];
        if (existingIdx >= 0) {
          updatedList = [...current];
          updatedList[existingIdx] = data as Datepay;
        } else {
          updatedList = [data as Datepay, ...current];
        }
        setStored(STORAGE_KEYS.DATEPAYS, updatedList);
        return data as Datepay;
      }
      if (error) {
        console.warn("Datepay upsert error, trying fallback:", error.message);
      }
    } catch (e) {
      console.warn("Datepay save fallback", e);
    }

    const current = getStoredOr<Datepay[]>(STORAGE_KEYS.DATEPAYS, MOCK_DATEPAYS);
    const existingIndex = current.findIndex((d) => d.date === targetDate && d.shop_id === shopId);

    const updatedItem: Datepay = {
      id: datepayData.id || (existingIndex >= 0 ? current[existingIndex].id : `dp-${Date.now()}`),
      shop_id: shopId,
      date: targetDate,
      investment_amount: payload.investment_amount,
      total_billing_cash: payload.total_billing_cash,
      total_billing_gpay: payload.total_billing_gpay,
      total_billing: payload.total_billing,
      total_expenses: payload.total_expenses,
      calculated_balance: payload.calculated_balance,
      actual_closing_cash: payload.actual_closing_cash,
      status: payload.status,
      notes: payload.notes,
      created_at: existingIndex >= 0 ? current[existingIndex].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let updatedList: Datepay[];
    if (existingIndex >= 0) {
      updatedList = [...current];
      updatedList[existingIndex] = updatedItem;
    } else {
      updatedList = [updatedItem, ...current];
    }
    setStored(STORAGE_KEYS.DATEPAYS, updatedList);
    return updatedItem;
  },

  // PURCHASES
  async getPurchases(shopId?: string): Promise<Purchase[]> {
    try {
      let query = supabase.from("purchases").select("*, supplier:suppliers(*)");
      if (shopId) query = query.eq("shop_id", shopId);
      const { data, error } = await query.order("purchase_date", { ascending: false });
      if (!error && data && data.length > 0) return data as Purchase[];
    } catch (e) {
      console.warn("Purchases fallback", e);
    }
    return getStoredOr(STORAGE_KEYS.PURCHASES, MOCK_PURCHASES);
  },

  async createPurchase(purchaseData: Partial<Purchase>): Promise<Purchase> {
    const { supplier, items, ...raw } = purchaseData;
    const targetShopId = raw.shop_id || MOCK_CURRENT_SHOP.id;
    const vendorName = raw.supplier_name || supplier?.name || (typeof raw.supplier_id === "string" && !raw.supplier_id.includes("-") ? raw.supplier_id : "") || "Local Vendor";

    const summaryNotes = [
      raw.product_name ? `Item: ${raw.product_name}` : "",
      raw.total_qty ? `Qty: ${raw.total_qty}` : "",
      raw.notes || "",
    ].filter(Boolean).join(" | ");

    const payload: any = {
      shop_id: targetShopId,
      invoice_number: raw.invoice_number || `INV-${Date.now().toString().slice(-4)}`,
      purchase_date: raw.purchase_date || new Date().toISOString().split("T")[0],
      total_amount: raw.total_amount || 0,
      paid_amount: raw.paid_amount || raw.total_amount || 0,
      payment_status: raw.payment_status || "PAID",
      payment_method: raw.payment_method || "UPI_QR",
      notes: summaryNotes,
    };

    if (raw.supplier_id && raw.supplier_id.includes("-")) {
      payload.supplier_id = raw.supplier_id;
    }

    try {
      const { data, error } = await supabase.from("purchases").insert([payload]).select("*, supplier:suppliers(*)").single();
      if (!error && data) {
        const fullPurchase: Purchase = {
          ...data,
          product_name: raw.product_name,
          total_qty: raw.total_qty,
          supplier_name: vendorName,
          supplier: data.supplier || supplier || ({ name: vendorName } as any),
        };
        const current = getStoredOr(STORAGE_KEYS.PURCHASES, MOCK_PURCHASES);
        setStored(STORAGE_KEYS.PURCHASES, [fullPurchase, ...current]);
        return fullPurchase;
      }
      if (error) {
        console.error("Supabase createPurchase error:", error.message, error.details);
      }
    } catch (e) {
      console.warn("Purchase insert fallback", e);
    }

    const current = getStoredOr("chaicraft_purchases", MOCK_PURCHASES);
    const newPurchase: Purchase = {
      id: raw.id || `po-${Date.now()}`,
      shop_id: targetShopId,
      supplier_id: raw.supplier_id,
      supplier_name: vendorName,
      product_name: raw.product_name,
      total_qty: raw.total_qty,
      invoice_number: raw.invoice_number || `INV-${Date.now().toString().slice(-4)}`,
      purchase_date: raw.purchase_date || new Date().toISOString().split("T")[0],
      total_amount: raw.total_amount || 0,
      paid_amount: raw.paid_amount || raw.total_amount || 0,
      payment_status: raw.payment_status || "PAID",
      payment_method: raw.payment_method || "UPI_QR",
      notes: summaryNotes,
      supplier: supplier || ({ name: vendorName } as any),
      created_at: new Date().toISOString(),
    };
    setStored("chaicraft_purchases", [newPurchase, ...current]);
    return newPurchase;
  },

  async updatePurchaseStockAdded(purchaseId: string, stockAdded = true): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("purchases")
        .update({ stock_added: stockAdded, updated_at: new Date().toISOString() })
        .eq("id", purchaseId);
      if (!error) {
        const current = getStoredOr<Purchase[]>("chaicraft_purchases", MOCK_PURCHASES);
        const updated = current.map((p) => (p.id === purchaseId ? { ...p, stock_added: stockAdded } : p));
        setStored("chaicraft_purchases", updated);
        return true;
      }
    } catch (e) {
      console.warn("updatePurchaseStockAdded fallback", e);
    }
    const current = getStoredOr<Purchase[]>("chaicraft_purchases", MOCK_PURCHASES);
    const updated = current.map((p) => (p.id === purchaseId ? { ...p, stock_added: stockAdded } : p));
    setStored("chaicraft_purchases", updated);
    return true;
  },

  async calculateDayMetrics(shopId: string, date: string): Promise<{
    billingCash: number;
    billingGpay: number;
    billingCard: number;
    billingTotal: number;
    expensesTotal: number;
    expensesCash: number;
    expensesOnline: number;
    purchasesTotal: number;
    purchasesCash: number;
    purchasesOnline: number;
    cashIn: number;
    cashOut: number;
  }> {
    const orders = await this.getOrders(shopId);
    const expenses = await this.getExpenses(shopId);
    const purchases = await this.getPurchases(shopId);
    const activeRegister = await this.getActiveRegister();

    const dayOrders = orders.filter(
      (o) => (isSameLocalDate(o.created_at, date) || o.created_at?.startsWith(date)) && (o.status === "COMPLETED" || !o.status)
    );
    const dayExpenses = expenses.filter(
      (e) => isSameLocalDate(e.expense_date, date) || isSameLocalDate(e.created_at, date) || e.expense_date === date
    );
    const dayPurchases = purchases.filter(
      (p) => isSameLocalDate(p.purchase_date, date) || isSameLocalDate(p.created_at, date) || p.purchase_date === date
    );

    let billingCash = 0;
    let billingGpay = 0;
    let billingCard = 0;
    let billingTotal = 0;

    dayOrders.forEach((o) => {
      billingTotal += o.total_amount;
      if (o.payment_method === "CASH") {
        billingCash += o.total_amount;
      } else if (o.payment_method === "UPI_QR") {
        billingGpay += o.total_amount;
      } else if (o.payment_method === "CARD") {
        billingCard += o.total_amount;
      } else if (o.payment_method === "SPLIT") {
        billingCash += o.cash_amount || 0;
        billingGpay += o.gpay_amount || 0;
      } else {
        billingCash += o.total_amount;
      }
    });

    let expensesCash = 0;
    let expensesOnline = 0;
    dayExpenses.forEach((e) => {
      // If the expense is COMPLETED / settled, the actual net expenditure is e.bill_amount.
      // If the expense is PENDING (unsettled), the temporary cash taken is e.amount.
      const effectiveExpenseAmt =
        e.status === "COMPLETED" && e.bill_amount !== undefined && e.bill_amount > 0
          ? Number(e.bill_amount)
          : Number(e.amount || 0);

      if (e.payment_method === "CASH") {
        expensesCash += effectiveExpenseAmt;
      } else {
        expensesOnline += effectiveExpenseAmt;
      }
    });
    const expensesTotal = expensesCash + expensesOnline;

    let purchasesCash = 0;
    let purchasesOnline = 0;
    dayPurchases.forEach((p) => {
      const amt = p.paid_amount || p.total_amount || 0;
      if (p.payment_method === "CASH") {
        purchasesCash += amt;
      } else {
        purchasesOnline += amt;
      }
    });
    const purchasesTotal = purchasesCash + purchasesOnline;

    return {
      billingCash,
      billingGpay,
      billingCard,
      billingTotal,
      expensesTotal,
      expensesCash,
      expensesOnline,
      purchasesTotal,
      purchasesCash,
      purchasesOnline,
      cashIn: activeRegister?.cash_in || 0,
      cashOut: activeRegister?.cash_out || 0,
    };
  },

  // SALARIES & ATTENDANCE
  async getSalaries(shopId?: string): Promise<Salary[]> {
    try {
      let query = supabase.from("salaries").select("*").order("created_at", { ascending: false });
      if (shopId) query = query.eq("shop_id", shopId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as Salary[];
      }
      if (error) {
        console.warn("Supabase getSalaries notice:", error.message);
      }
    } catch (e) {
      console.warn("Salaries query fallback", e);
    }
    return getStoredOr(STORAGE_KEYS.SALARIES, MOCK_SALARIES);
  },

  async recordSalaryPayment(salaryData: Partial<Salary>): Promise<Salary> {
    const targetShopId = salaryData.shop_id || MOCK_CURRENT_SHOP.id;
    const payload: any = {
      shop_id: targetShopId,
      employee_id: salaryData.employee_id,
      month: salaryData.month || new Date().getMonth() + 1,
      year: salaryData.year || new Date().getFullYear(),
      base_salary: Number(salaryData.base_salary) || 0,
      allowances: Number(salaryData.allowances) || 0,
      bonus: Number(salaryData.bonus) || 0,
      advances_deducted: Number(salaryData.advances_deducted) || 0,
      other_deductions: Number(salaryData.other_deductions) || 0,
      net_payable: Number(salaryData.net_payable) || 0,
      paid_amount: Number(salaryData.paid_amount) || Number(salaryData.net_payable) || 0,
      payment_status: salaryData.payment_status || "PAID",
      payment_method: salaryData.payment_method || "UPI_QR",
      payment_date: salaryData.payment_date || new Date().toISOString().split("T")[0],
      notes: salaryData.notes || "",
      updated_at: new Date().toISOString(),
    };

    if (salaryData.id && salaryData.id.includes("-")) {
      payload.id = salaryData.id;
    }

    try {
      const { data, error } = await supabase
        .from("salaries")
        .upsert([payload], { onConflict: "shop_id, employee_id, month, year" })
        .select()
        .single();
      if (!error && data) {
        const fullSal = { ...data, employee: salaryData.employee } as Salary;
        const current = getStoredOr(STORAGE_KEYS.SALARIES, MOCK_SALARIES);
        setStored(STORAGE_KEYS.SALARIES, [fullSal, ...current.filter((s) => s.id !== fullSal.id)]);
        return fullSal;
      }
      if (error) {
        console.error("Supabase recordSalaryPayment error:", error.message, error.details);
      }
    } catch (e) {
      console.warn("Salary record database fallback", e);
    }
    const current = getStoredOr(STORAGE_KEYS.SALARIES, MOCK_SALARIES);
    const newSalary: Salary = {
      id: salaryData.id || `sal-${Date.now()}`,
      shop_id: targetShopId,
      employee_id: salaryData.employee_id || "emp-1",
      month: payload.month,
      year: payload.year,
      base_salary: payload.base_salary,
      allowances: payload.allowances,
      bonus: payload.bonus,
      advances_deducted: payload.advances_deducted,
      other_deductions: payload.other_deductions,
      net_payable: payload.net_payable,
      paid_amount: payload.paid_amount,
      payment_status: payload.payment_status,
      payment_method: payload.payment_method,
      payment_date: payload.payment_date,
      notes: payload.notes,
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
