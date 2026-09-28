import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { dataService } from "@/services/supabaseService";
import { useAuthStore } from "@/stores/authStore";
import { Product, Category } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { getPdfWatermarkCss, getPdfWatermarkHtml, getPdfHeaderHtml } from "@/lib/pdfUtils";
import { Plus, Coffee, Scale, Package, Edit, Trash2, FileSpreadsheet, FileText } from "lucide-react";

export const ProductList: React.FC = () => {
  const navigate = useNavigate();
  const { shop, user } = useAuthStore();
  const currentShopId = shop?.id || user?.shop_id;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadProducts = async () => {
    setIsLoading(true);
    const prods = await dataService.getProducts(currentShopId);
    const cats = await dataService.getCategories(currentShopId);
    setProducts(prods);
    setCategories(cats);
    setIsLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, [currentShopId]);

  const handleStatusChange = async (productId: string, newStatus: "ACTIVE" | "INACTIVE") => {
    const isAvail = newStatus === "ACTIVE";
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, is_available: isAvail, is_active: isAvail } : p))
    );
    await dataService.updateProductStatus(productId, isAvail);
  };

  const handleDelete = async (p: Product) => {
    if (confirm(`Are you sure you want to delete product "${p.name}"?`)) {
      setProducts((prev) => prev.filter((item) => item.id !== p.id));
      await dataService.deleteProduct(p.id);
    }
  };

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
        if (p.track_stock === false || p.is_unlimited || p.stock_quantity === undefined || p.stock_quantity === null) {
          return (
            <div className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <Coffee className="w-3 h-3" />
              <span>Unlimited ∞</span>
            </div>
          );
        }
        return (
          <div className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <Package className="w-3 h-3" />
            <span>{p.stock_quantity} Qty</span>
          </div>
        );
      },
    },
    {
      key: "is_active",
      header: "Status",
      render: (p: Product) => {
        const isAct = p.is_active !== false && p.is_available !== false;
        return (
          <select
            value={isAct ? "ACTIVE" : "INACTIVE"}
            onChange={(e) => handleStatusChange(p.id, e.target.value as "ACTIVE" | "INACTIVE")}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold border cursor-pointer transition-all outline-none ${
              isAct
                ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
            }`}
          >
            <option value="ACTIVE">● ACTIVE</option>
            <option value="INACTIVE">○ INACTIVE</option>
          </select>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (p: Product) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate(`/admin/products/${p.id}/edit`)}
            title="Edit product"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-300 dark:text-slate-400 dark:hover:text-amber-300 dark:hover:bg-amber-950/40 transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(p)}
            title="Delete product"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Export to Excel (.csv)
  const handleExportExcel = () => {
    if (products.length === 0) {
      alert("No products found to export.");
      return;
    }

    const headers = [
      "Product Name",
      "SKU",
      "Pricing Type",
      "Base Price (INR)",
      "Regular Price (INR)",
      "Thirsty Price (INR)",
      "Unit Mode",
      "Stock Quantity / Weight",
      "Status",
    ];

    const rows = products.map((p) => {
      const isWeight = p.unit_mode === "WEIGHT";
      const stockStr = isWeight
        ? `${p.available_weight ?? 1000} ${p.weight_unit || "GM"}`
        : p.track_stock === false || p.is_unlimited || p.stock_quantity === undefined || p.stock_quantity === null
        ? "Unlimited"
        : `${p.stock_quantity} Qty`;

      const isRegThirsty = p.price_mode === "REGULAR_THIRSTY" || (p.regular_price && p.thirsty_price);

      return [
        `"${p.name || ''}"`,
        `"${p.sku || 'N/A'}"`,
        `"${isRegThirsty ? 'Regular & Thirsty' : 'Standard'}"`,
        p.base_price || 0,
        p.regular_price || p.base_price || 0,
        p.thirsty_price || 0,
        `"${p.unit_mode || 'QTY'}"`,
        `"${stockStr}"`,
        `"${p.is_active !== false && p.is_available !== false ? 'ACTIVE' : 'INACTIVE'}"`,
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const shopSlug = (shop?.name || "Store").replace(/[^a-zA-Z0-9_-]/g, "_");
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `Products_Catalog_${shopSlug}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (products.length === 0) {
      alert("No products found to export.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const shopName = shop?.name || "Tea Shop";
    const shopAddress = shop?.address || "";
    const totalCount = products.length;
    const activeCount = products.filter((p) => p.is_active !== false && p.is_available !== false).length;
    const inactiveCount = totalCount - activeCount;

    const rowsHtml = products
      .map((p) => {
        const isWeight = p.unit_mode === "WEIGHT";
        const stockStr = isWeight
          ? `${p.available_weight ?? 1000} ${p.weight_unit || "GM"}`
          : p.track_stock === false || p.is_unlimited || p.stock_quantity === undefined || p.stock_quantity === null
          ? "Unlimited ∞"
          : `${p.stock_quantity} Qty`;

        const isRegThirsty = p.price_mode === "REGULAR_THIRSTY" || (p.regular_price && p.thirsty_price);
        const priceStr = isRegThirsty
          ? `Regular: ₹${p.regular_price || p.base_price} | Thirsty: ₹${p.thirsty_price || 0}`
          : `₹${p.base_price}`;

        const isAct = p.is_active !== false && p.is_available !== false;

        return `
        <tr>
          <td><strong>${p.name}</strong><br><small style="color: #64748b;">SKU: ${p.sku || 'N/A'}</small></td>
          <td>${priceStr}</td>
          <td>${stockStr}</td>
          <td><span class="badge ${isAct ? 'active' : 'inactive'}">${isAct ? 'ACTIVE' : 'INACTIVE'}</span></td>
        </tr>
      `;
      })
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Menu & Product Catalog - ${shopName}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1e293b; position: relative; }
          .shop-title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
          .shop-meta { font-size: 11px; color: #64748b; margin-top: 2px; }
          .report-badge { background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 12px; display: inline-block; }
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
          .stat-box { background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; }
          .stat-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
          .stat-val { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
          th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; }
          td { border: 1px solid #e2e8f0; padding: 8px 10px; }
          tr:nth-child(even) { background: #f8fafc; }
          .badge { padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
          .badge.active { background: #dcfce7; color: #166534; }
          .badge.inactive { background: #fee2e2; color: #991b1b; }
          .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          ${getPdfWatermarkCss()}
          @media print { body { padding: 0; } @page { size: portrait; margin: 12mm; } }
        </style>
      </head>
      <body>
        ${getPdfWatermarkHtml(shopName, shop?.logo_url)}
        ${getPdfHeaderHtml(shopName, shopAddress, "MENU & BEVERAGES CATALOG", shop?.logo_url)}

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-label">Total Catalog Items</div>
            <div class="stat-val">${totalCount}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label" style="color: #166534;">Active Menu Items</div>
            <div class="stat-val" style="color: #166534;">${activeCount}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label" style="color: #991b1b;">Inactive Items</div>
            <div class="stat-val" style="color: #991b1b;">${inactiveCount}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Product Item</th>
              <th>Pricing Structure</th>
              <th>Unit / Stock</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">Report generated from ${shopName} Management System.</div>
        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

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
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              onClick={handleExportExcel}
              disabled={products.length === 0}
            >
              Download Excel (.csv)
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
              onClick={handleExportPDF}
              disabled={products.length === 0}
            >
              Download PDF
            </Button>
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => navigate("/admin/products/new")}
            >
              Add Product Item
            </Button>
          </div>
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
