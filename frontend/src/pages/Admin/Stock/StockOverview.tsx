import React, { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { dataService } from "@/services/supabaseService";
import { useAuthStore } from "@/stores/authStore";
import { Product, Category } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  Package,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Coffee,
  Scale,
  Plus,
  Minus,
  SlidersHorizontal,
  ArrowUpDown,
  Boxes,
} from "lucide-react";

const LOW_STOCK_THRESHOLD = 50;

export const StockOverview: React.FC = () => {
  const { shop } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"LOW_STOCK" | "ALL">("LOW_STOCK");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Stock Update Modal State
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustWeight, setAdjustWeight] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const [prods, cats] = await Promise.all([
      dataService.getProducts(shop?.id),
      dataService.getCategories(shop?.id),
    ]);
    setProducts(prods);
    setCategories(cats);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [shop?.id]);

  const categoriesMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const isLowStock = (p: Product) => {
    if (p.is_unlimited || p.track_stock === false) return false;
    if (p.unit_mode === "WEIGHT") {
      const weight = p.available_weight ?? p.stock_quantity ?? 0;
      return weight < LOW_STOCK_THRESHOLD;
    }
    const qty = p.stock_quantity ?? 0;
    return qty < LOW_STOCK_THRESHOLD;
  };

  const lowStockCount = useMemo(() => {
    return products.filter((p) => isLowStock(p)).length;
  }, [products]);

  const healthyStockCount = useMemo(() => {
    return products.filter((p) => !isLowStock(p) && !p.is_unlimited && p.track_stock !== false).length;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== "ALL" && p.category_id !== selectedCategory) {
        return false;
      }
      if (activeTab === "LOW_STOCK") {
        return isLowStock(p);
      }
      return true;
    });
  }, [products, activeTab, selectedCategory]);

  const handleOpenAdjust = (product: Product) => {
    setSelectedProduct(product);
    setAdjustQty((product.stock_quantity ?? 0).toString());
    setAdjustWeight((product.available_weight ?? 0).toString());
    setAdjustReason("");
    setAdjustModalOpen(true);
  };

  const handleQuickAdjust = (delta: number) => {
    if (!selectedProduct) return;
    if (selectedProduct.unit_mode === "WEIGHT") {
      const curr = parseFloat(adjustWeight) || 0;
      setAdjustWeight(Math.max(0, curr + delta).toString());
    } else {
      const curr = parseInt(adjustQty, 10) || 0;
      setAdjustQty(Math.max(0, curr + delta).toString());
    }
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setIsSaving(true);
    const newQty = parseInt(adjustQty, 10) || 0;
    const newWeight = parseFloat(adjustWeight) || 0;

    try {
      await dataService.updateProductStock(
        selectedProduct.id,
        newQty,
        selectedProduct.unit_mode === "WEIGHT" ? newWeight : undefined
      );

      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id
            ? {
                ...p,
                stock_quantity: newQty,
                available_weight: selectedProduct.unit_mode === "WEIGHT" ? newWeight : p.available_weight,
                track_stock: true,
                is_unlimited: false,
              }
            : p
        )
      );

      setAdjustModalOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      console.error("Failed to update stock:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Product Item",
      render: (p: Product) => {
        const catName = p.category_id ? categoriesMap.get(p.category_id) : "General";
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              {p.unit_mode === "WEIGHT" ? <Scale className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">{p.name}</span>
              <span className="text-xs text-slate-400">
                {catName} &bull; SKU: {p.sku || "N/A"}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "stock_quantity",
      header: "Available Stock",
      render: (p: Product) => {
        if (p.is_unlimited || p.track_stock === false) {
          return (
            <div className="space-y-0.5">
              <span className="font-semibold text-xs text-slate-500 block">Unlimited Stock</span>
              <Badge variant="info" size="sm">
                NO TRACKING
              </Badge>
            </div>
          );
        }

        const isWeight = p.unit_mode === "WEIGHT";
        const currentAmount = isWeight ? p.available_weight ?? 0 : p.stock_quantity ?? 0;
        const unitLabel = isWeight ? p.weight_unit || "GM" : "Qty";
        const low = currentAmount < LOW_STOCK_THRESHOLD;

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`font-black text-sm ${low ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>
                {currentAmount} {unitLabel}
              </span>
            </div>
            {low ? (
              <Badge variant="danger" size="sm" className="inline-flex items-center gap-1 font-bold">
                <AlertTriangle className="w-3 h-3" />
                LOW STOCK (&lt;{LOW_STOCK_THRESHOLD})
              </Badge>
            ) : (
              <Badge variant="success" size="sm" className="inline-flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                IN STOCK
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "threshold",
      header: "Min Alert Threshold",
      render: () => (
        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          &lt; {LOW_STOCK_THRESHOLD} Units
        </span>
      ),
    },
    {
      key: "pricing",
      header: "Pricing Mode",
      render: (p: Product) => {
        if (p.price_mode === "REGULAR_THIRSTY" || (p.regular_price && p.thirsty_price)) {
          return (
            <div className="text-xs space-y-0.5">
              <span className="text-slate-500 block">Reg: {formatCurrency(p.regular_price || p.base_price)}</span>
              <span className="font-semibold text-amber-600 block">Thirsty: {formatCurrency(p.thirsty_price || 0)}</span>
            </div>
          );
        }
        return (
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {formatCurrency(p.base_price)}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Stock Action",
      render: (p: Product) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleOpenAdjust(p)}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          className="hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 text-xs font-semibold"
        >
          Update Stock
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-2">
              <Boxes className="w-6 h-6 text-amber-500" />
              Product Stock & Inventory
            </h1>
            <p className="text-xs text-slate-500">
              Monitor inventory levels, low stock alerts (&lt; {LOW_STOCK_THRESHOLD} units), and record physical stock adjustments
            </p>
          </div>
          <Button
            variant="secondary"
            icon={<RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />}
            onClick={loadData}
          >
            Refresh Stock
          </Button>
        </div>

        {/* Stock Level Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => setActiveTab("LOW_STOCK")}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              activeTab === "LOW_STOCK"
                ? "bg-rose-50 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800 ring-2 ring-rose-400"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">Low Stock Alert (&lt; 50)</p>
                <h3 className="text-2xl font-black text-rose-800 dark:text-rose-200 mt-1">{lowStockCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-2 font-medium">
              Products needing urgent restock
            </p>
          </div>

          <div
            onClick={() => setActiveTab("ALL")}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              activeTab === "ALL"
                ? "bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800 ring-2 ring-amber-400"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Adequate Stock (≥ 50)</p>
                <h3 className="text-2xl font-black text-emerald-800 dark:text-emerald-200 mt-1">{healthyStockCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-2 font-medium">
              Healthy inventory levels
            </p>
          </div>

          <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Products</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{products.length}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              Total items in product catalog
            </p>
          </div>
        </div>

        {/* Filter Tabs & Category Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("LOW_STOCK")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "LOW_STOCK"
                  ? "bg-rose-600 text-white shadow-sm shadow-rose-600/30"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-rose-400"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Low Stock Only (&lt; 50)</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                {lowStockCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "ALL"
                  ? "bg-amber-600 text-white shadow-sm shadow-amber-600/30"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-amber-400"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>All Products</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                {products.length}
              </span>
            </button>
          </div>

          {categories.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredProducts}
          searchKey="name"
          searchPlaceholder="Search product by name or SKU..."
        />
      </div>

      {/* Stock Adjustment Modal */}
      {selectedProduct && (
        <Modal
          isOpen={adjustModalOpen}
          onClose={() => {
            setAdjustModalOpen(false);
            setSelectedProduct(null);
          }}
          title={`Update Stock: ${selectedProduct.name}`}
          size="md"
        >
          <form onSubmit={handleSaveStock} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                Product Details
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                <strong>{selectedProduct.name}</strong> ({selectedProduct.unit_mode === "WEIGHT" ? "Weight-based Item" : "Quantity-based Item"})
              </p>
              <p className="text-[11px] text-slate-500">
                Current Stock on Record:{" "}
                <strong className="text-slate-900 dark:text-white">
                  {selectedProduct.unit_mode === "WEIGHT"
                    ? `${selectedProduct.available_weight ?? 0} ${selectedProduct.weight_unit || "GM"}`
                    : `${selectedProduct.stock_quantity ?? 0} Qty`}
                </strong>
              </p>
            </div>

            {selectedProduct.unit_mode === "WEIGHT" ? (
              <div>
                <Input
                  label={`Available Weight (${selectedProduct.weight_unit || "GM"}) *`}
                  type="number"
                  step="1"
                  min="0"
                  value={adjustWeight}
                  onChange={(e) => setAdjustWeight(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div>
                <Input
                  label="Physical Stock Quantity (Pieces / Cups / Packs) *"
                  type="number"
                  step="1"
                  min="0"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Quick Adjustment Increment Buttons */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Quick Adjust Stock
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickAdjust(10)}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100"
                >
                  +10
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdjust(25)}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100"
                >
                  +25
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdjust(50)}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100"
                >
                  +50
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdjust(100)}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100"
                >
                  +100
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdjust(-5)}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdjust(-10)}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100"
                >
                  -10
                </button>
              </div>
            </div>

            <Input
              label="Adjustment Reason / Audit Notes (Optional)"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="e.g. Fresh stock arrival, physical count verification, spoilage"
            />

            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setAdjustModalOpen(false);
                  setSelectedProduct(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="flex-1" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Stock Level"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
};
export default StockOverview;
