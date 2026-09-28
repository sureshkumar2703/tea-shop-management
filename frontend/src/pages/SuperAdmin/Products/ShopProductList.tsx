import React, { useState, useEffect, useMemo } from "react";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { dataService } from "@/services/supabaseService";
import { Shop, Product, Category } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getPdfWatermarkHtml, getPdfWatermarkCss, getPdfHeaderHtml } from "@/lib/pdfUtils";
import {
  Package,
  Store,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Coffee,
  Scale,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  DollarSign,
  Layers,
  Infinity,
} from "lucide-react";

export const ShopProductList: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [stockFilter, setStockFilter] = useState<string>("ALL");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("ALL");

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const fetchedShops = await dataService.getShops();
      setShops(fetchedShops);
      if (fetchedShops.length > 0) {
        setSelectedShopId(fetchedShops[0].id);
      }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedShopId) return;
    setLoading(true);
    Promise.all([
      dataService.getProducts(selectedShopId),
      dataService.getCategories(selectedShopId),
    ]).then(([prodsData, catsData]) => {
      setProducts(prodsData || []);
      setCategories(catsData || []);
      setLoading(false);
    });
  }, [selectedShopId]);

  const selectedShopObj = shops.find((s) => s.id === selectedShopId) || shops[0];

  // Map category id to name
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Category Filter
    if (selectedCategory !== "ALL") {
      list = list.filter((p) => p.category_id === selectedCategory);
    }

    // Availability Filter
    if (availabilityFilter !== "ALL") {
      const isAvail = availabilityFilter === "AVAILABLE";
      list = list.filter((p) => (p.is_available !== false && p.is_active !== false) === isAvail);
    }

    // Stock Filter
    if (stockFilter !== "ALL") {
      if (stockFilter === "IN_STOCK") {
        list = list.filter(
          (p) =>
            p.track_stock === false ||
            p.is_unlimited ||
            (p.stock_quantity !== undefined && p.stock_quantity !== null && p.stock_quantity > 10)
        );
      } else if (stockFilter === "LOW_STOCK") {
        list = list.filter(
          (p) =>
            p.track_stock !== false &&
            !p.is_unlimited &&
            p.stock_quantity !== undefined &&
            p.stock_quantity !== null &&
            p.stock_quantity > 0 &&
            p.stock_quantity <= 10
        );
      } else if (stockFilter === "OUT_OF_STOCK") {
        list = list.filter(
          (p) =>
            p.track_stock !== false &&
            !p.is_unlimited &&
            (p.stock_quantity === 0 || p.stock_quantity === null || p.stock_quantity === undefined)
        );
      } else if (stockFilter === "UNLIMITED") {
        list = list.filter((p) => p.track_stock === false || p.is_unlimited);
      }
    }

    // Search Term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          categoryMap.get(p.category_id || "")?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [products, selectedCategory, stockFilter, availabilityFilter, searchTerm, categoryMap]);

  // Summary Metrics
  const totalProductsCount = products.length;
  const totalStockQty = products.reduce((sum, p) => {
    if (p.unit_mode === "WEIGHT") return sum;
    if (p.track_stock === false || p.is_unlimited) return sum;
    return sum + (Number(p.stock_quantity) || 0);
  }, 0);

  const lowStockCount = products.filter(
    (p) =>
      p.track_stock !== false &&
      !p.is_unlimited &&
      p.stock_quantity !== undefined &&
      p.stock_quantity !== null &&
      p.stock_quantity > 0 &&
      p.stock_quantity <= 10
  ).length;

  const outOfStockCount = products.filter(
    (p) =>
      p.track_stock !== false &&
      !p.is_unlimited &&
      (p.stock_quantity === 0 || p.stock_quantity === null || p.stock_quantity === undefined)
  ).length;

  // Export CSV
  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        "Product Name,SKU,Category,Price Mode,Regular Price,Thirsty Price,Base Price,Cost Price,Unit Mode,Available Stock QTY,Status",
      ].join(",") +
      "\n" +
      filteredProducts
        .map((p) =>
          [
            `"${p.name}"`,
            `"${p.sku || "N/A"}"`,
            `"${categoryMap.get(p.category_id || "") || "Uncategorized"}"`,
            `"${p.price_mode || "STANDARD"}"`,
            p.regular_price || p.base_price || 0,
            p.thirsty_price || 0,
            p.base_price || 0,
            p.cost_price || 0,
            `"${p.unit_mode || "QTY"}"`,
            p.unit_mode === "WEIGHT"
              ? `"${p.available_weight || 0} ${p.weight_unit || "GM"}"`
              : p.track_stock === false || p.is_unlimited
              ? '"Unlimited"'
              : p.stock_quantity ?? 0,
            `"${p.is_available !== false ? "Available" : "Unavailable"}"`,
          ].join(",")
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Shop_Products_Inventory_${selectedShopObj?.name || "Store"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF with Watermark and Shop Logo
  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = filteredProducts
      .map((p, idx) => {
        let stockDisplay = "";
        if (p.unit_mode === "WEIGHT") {
          stockDisplay = `${p.available_weight || 0} ${p.weight_unit || "GM"}`;
        } else if (p.track_stock === false || p.is_unlimited) {
          stockDisplay = "Unlimited";
        } else {
          stockDisplay = `${p.stock_quantity ?? 0} Units`;
        }

        let priceDisplay = "";
        if (p.price_mode === "REGULAR_THIRSTY" || (p.regular_price && p.thirsty_price)) {
          priceDisplay = `Reg: ${formatCurrency(p.regular_price || p.base_price)} | Thr: ${formatCurrency(p.thirsty_price || 0)}`;
        } else {
          priceDisplay = formatCurrency(p.base_price);
        }

        return `
        <tr>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${idx + 1}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600; font-size: 11px;">${p.name} <br/><span style="font-size: 9px; color: #94a3b8;">SKU: ${p.sku || "N/A"}</span></td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;"><span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">${categoryMap.get(p.category_id || "") || "General"}</span></td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 600; color: #d97706;">${priceDisplay}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: center; font-weight: 700; color: #047857;">${stockDisplay}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${p.is_available !== false ? "Available" : "Disabled"}</td>
        </tr>
      `;
      })
      .join("");

    const watermarkHtml = getPdfWatermarkHtml(selectedShopObj?.name || "Store", selectedShopObj?.logo_url);
    const watermarkCss = getPdfWatermarkCss();
    const headerHtml = getPdfHeaderHtml(
      selectedShopObj?.name || "Store",
      selectedShopObj?.address || "Main Store Location",
      `Shop Products & Stock Inventory Ledger (${filteredProducts.length} Items)`,
      selectedShopObj?.logo_url
    );

    printWindow.document.write(`
      <html>
        <head>
          <title>${selectedShopObj?.name || "Store"} - Products & Stock QTY Report</title>
          <style>
            ${watermarkCss}
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1e293b; position: relative; }
            .metrics-grid { display: flex; gap: 12px; margin-bottom: 20px; }
            .metric-box { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc; }
            .metric-title { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 4px; }
            .metric-val { font-size: 16px; font-weight: bold; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-size: 11px; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1; }
          </style>
        </head>
        <body>
          ${watermarkHtml}
          ${headerHtml}
          
          <div class="metrics-grid">
            <div class="metric-box">
              <div class="metric-title">Total Products</div>
              <div class="metric-val">${totalProductsCount} Menu Items</div>
            </div>
            <div class="metric-box">
              <div class="metric-title">Total Tracked Stock QTY</div>
              <div class="metric-val" style="color: #047857;">${totalStockQty.toLocaleString()} Qty</div>
            </div>
            <div class="metric-box">
              <div class="metric-title">Low Stock Items</div>
              <div class="metric-val" style="color: #b45309;">${lowStockCount} Items</div>
            </div>
            <div class="metric-box">
              <div class="metric-title">Out of Stock Items</div>
              <div class="metric-val" style="color: #dc2626;">${outOfStockCount} Items</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product Name & SKU</th>
                <th>Category</th>
                <th>Price Structure</th>
                <th style="text-align: center;">Stock Quantity (QTY)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #94a3b8;">No products found for this shop.</td></tr>'}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6 font-['Outfit']">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-amber-500" />
              Shop Products & Stock Inventory
            </h1>
            <p className="text-xs text-slate-500">
              Select any franchise to audit complete product catalog, item prices, and real-time available stock quantities
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Shop Selector Dropdown */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm">
              <Store className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Shop:</span>
              <select
                value={selectedShopId}
                onChange={(e) => setSelectedShopId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer pr-2"
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id} className="dark:bg-slate-900">
                    {s.name} ({s.shop_code || "Code"})
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <Button variant="outline" size="sm" icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />} onClick={handleExportCSV}>
              Export CSV
            </Button>
            <Button variant="primary" size="sm" icon={<Download className="w-4 h-4" />} onClick={handleExportPDF}>
              Download PDF Report
            </Button>
          </div>
        </div>

        {/* Selected Shop Badge Banner */}
        {selectedShopObj && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {selectedShopObj.logo_url ? (
                <img
                  src={selectedShopObj.logo_url}
                  alt={selectedShopObj.name}
                  className="w-10 h-10 rounded-xl object-cover border border-amber-500/30"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
                  <Store className="w-5 h-5" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{selectedShopObj.name}</h3>
                  <Badge variant="amber" size="sm">{selectedShopObj.shop_code || "Active Shop"}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{selectedShopObj.address || "Main Store Location"} • Phone: {selectedShopObj.phone || "N/A"}</p>
              </div>
            </div>
            <Badge variant="info" size="sm" className="self-start sm:self-auto">
              {filteredProducts.length} Items Listed
            </Badge>
          </div>
        )}

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Menu Products"
            value={`${totalProductsCount} Items`}
            icon={<Package className="w-5 h-5 text-amber-500" />}
            color="amber"
          />
          <StatCard
            title="Total Available Stock QTY"
            value={`${totalStockQty.toLocaleString()} Units`}
            icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
            color="emerald"
          />
          <StatCard
            title="Low Stock Alert (<= 10)"
            value={`${lowStockCount} Items`}
            icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
            color="amber"
          />
          <StatCard
            title="Out of Stock Items"
            value={`${outOfStockCount} Items`}
            icon={<XCircle className="w-5 h-5 text-purple-500" />}
            color="purple"
          />
        </div>

        {/* Filters and Search Bar */}
        <Card className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search products by name, SKU, category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="ALL">All Categories ({categories.length})</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500">Stock QTY:</span>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="ALL">All Stock Levels</option>
                  <option value="IN_STOCK">In Stock (&gt; 10 Qty)</option>
                  <option value="LOW_STOCK">Low Stock (1 - 10 Qty)</option>
                  <option value="OUT_OF_STOCK">Out of Stock (0 Qty)</option>
                  <option value="UNLIMITED">Unlimited / Untracked</option>
                </select>
              </div>

              {/* Availability Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500">Status:</span>
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="ALL">All Items</option>
                  <option value="AVAILABLE">Available Only</option>
                  <option value="UNAVAILABLE">Disabled Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">#</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Product Item</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pricing Structure</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unit Mode</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Available Stock (QTY)</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Counter Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                      No products found for the selected shop and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p, idx) => {
                    const isAvail = p.is_available !== false && p.is_active !== false;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {p.image_url ? (
                              <img
                                src={p.image_url}
                                alt={p.name}
                                className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <Coffee className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">{p.name}</span>
                              <span className="text-[11px] text-slate-400 font-mono">SKU: {p.sku || "N/A"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="amber" size="sm">
                            {categoryMap.get(p.category_id || "") || "Uncategorized"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {p.price_mode === "REGULAR_THIRSTY" || (p.regular_price && p.thirsty_price) ? (
                            <div className="space-y-0.5 text-[11px]">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400">Regular:</span>
                                <span className="font-bold text-amber-600 dark:text-amber-400">
                                  {formatCurrency(p.regular_price || p.base_price)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400">Thirsty:</span>
                                <span className="font-bold text-amber-700 dark:text-amber-300">
                                  {formatCurrency(p.thirsty_price || 0)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="font-bold text-amber-600 dark:text-amber-400 font-mono text-sm">
                              {formatCurrency(p.base_price)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {p.unit_mode === "WEIGHT" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                              <Scale className="w-3 h-3 text-amber-500" /> Weight Basis
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                              <Package className="w-3 h-3 text-blue-500" /> Quantity (Units)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {p.unit_mode === "WEIGHT" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold font-mono">
                              <Scale className="w-3 h-3" />
                              {p.available_weight ?? 1000} {p.weight_unit || "GM"}
                            </span>
                          ) : p.track_stock === false || p.is_unlimited ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold">
                              <Infinity className="w-3 h-3 text-slate-400" />
                              Unlimited
                            </span>
                          ) : (p.stock_quantity ?? 0) > 10 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold font-mono">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {p.stock_quantity} In Stock
                            </span>
                          ) : (p.stock_quantity ?? 0) > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold font-mono">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              {p.stock_quantity} Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold font-mono">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              0 Out of Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={isAvail ? "success" : "danger"} size="sm">
                            {isAvail ? "Active / POS Ready" : "Disabled"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default ShopProductList;
