import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { dataService } from "@/services/supabaseService";
import { Product, Category } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Plus, Coffee, Sparkles, Scale, Package, CheckCircle2 } from "lucide-react";

export const ProductList: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    dataService.getProducts().then(setProducts);
    dataService.getCategories().then(setCategories);
  }, []);

  const columns = [
    {
      key: "name",
      header: "Product Item",
      render: (p: Product) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Coffee className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white block">{p.name}</span>
            <span className="text-xs text-slate-400">SKU: {p.sku || "N/A"}</span>
          </div>
        </div>
      ),
    },
    {
      key: "pricing",
      header: "Pricing Structure",
      render: (p: Product) => {
        if (p.price_mode === "REGULAR_THIRSTY" || (p.regular_price && p.thirsty_price)) {
          return (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400">Regular:</span>
                <span className="font-bold text-amber-600">{formatCurrency(p.regular_price || p.base_price)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400">Thirsty:</span>
                <span className="font-bold text-amber-700 dark:text-amber-400">{formatCurrency(p.thirsty_price || 0)}</span>
              </div>
            </div>
          );
        }
        return (
          <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
            {formatCurrency(p.base_price)}
          </span>
        );
      },
    },
    {
      key: "unit_mode",
      header: "Unit / Stock",
      render: (p: Product) => {
        if (p.unit_mode === "WEIGHT") {
          return (
            <div className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <Scale className="w-3 h-3" />
              <span>{p.available_weight ?? 1000} {p.weight_unit || "GM"}</span>
            </div>
          );
        }
        return (
          <div className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <Package className="w-3 h-3" />
            <span>{p.stock_quantity ?? 100} Qty</span>
          </div>
        );
      },
    },
    {
      key: "is_active",
      header: "Status",
      render: (p: Product) => (
        <Badge variant={p.is_active !== false && p.is_available !== false ? "success" : "danger"}>
          {p.is_active !== false && p.is_available !== false ? "ACTIVE" : "INACTIVE"}
        </Badge>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-2">
              <Coffee className="w-6 h-6 text-amber-500" />
              Menu & Beverage Catalog
            </h1>
            <p className="text-xs text-slate-500">
              Manage items with Regular & Thirsty portions or standard pricing, and Qty vs Gm/Kg weights
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate("/admin/products/new")}
          >
            Add Product Item
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={products}
          searchKey="name"
          searchPlaceholder="Search products by name or SKU..."
        />
      </div>
    </AdminLayout>
  );
};
export default ProductList;
