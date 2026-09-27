import React, { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { dataService } from "@/services/supabaseService";
import { useAuthStore } from "@/stores/authStore";
import { Category, Shop } from "@/types";
import { Plus, Boxes, Sparkles, Coffee, Store, Building2, Edit2, FileSpreadsheet, FileText } from "lucide-react";

export const CategoryList: React.FC = () => {
  const { shop, user } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [shopId, setShopId] = useState(shop?.id || user?.shop_id || "a1111111-1111-1111-1111-111111111111");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hasRegularThirsty, setHasRegularThirsty] = useState(false);
  const [enableRegular, setEnableRegular] = useState(true);
  const [enableThirsty, setEnableThirsty] = useState(true);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    dataService.getCategories().then(setCategories);
    dataService.getShops().then((res) => {
      setShops(res);
      if (res && res.length > 0) {
        const defaultId = shop?.id || user?.shop_id || res[0].id;
        setShopId(defaultId);
      }
    });
  }, []);

  useEffect(() => {
    if (shop?.id || user?.shop_id) {
      setShopId(shop?.id || user?.shop_id || "a1111111-1111-1111-1111-111111111111");
    }
  }, [shop, user]);

  const shopsMap = useMemo(() => {
    const map = new Map<string, Shop>();
    shops.forEach((s) => map.set(s.id, s));
    return map;
  }, [shops]);

  const selectedShop = useMemo(() => {
    return shopsMap.get(shopId) || (shop?.id === shopId ? shop : null) || shops[0] || null;
  }, [shopsMap, shopId, shop, shops]);

  const getShopName = (id?: string) => {
    if (!id) return shop?.name || "Artisan Chai Store";
    const found = shopsMap.get(id);
    if (found) return found.name;
    if (shop && shop.id === id) return shop.name;
    return shop?.name || "Artisan Chai Store";
  };

  const getShopCode = (id?: string) => {
    if (!id) return shop?.shop_code || "";
    const found = shopsMap.get(id);
    if (found) return found.shop_code;
    if (shop && shop.id === id) return shop.shop_code;
    return "";
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setShopId(shop?.id || user?.shop_id || (shops[0]?.id ?? "a1111111-1111-1111-1111-111111111111"));
    setHasRegularThirsty(false);
    setEnableRegular(true);
    setEnableThirsty(true);
    setIsActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name || "");
    setDescription(category.description || "");
    setShopId(category.shop_id || shop?.id || user?.shop_id || (shops[0]?.id ?? "a1111111-1111-1111-1111-111111111111"));
    setHasRegularThirsty(!!category.has_regular_thirsty);
    const types = category.regular_thirsty_types || [];
    setEnableRegular(types.length === 0 || types.includes("Regular"));
    setEnableThirsty(types.length === 0 || types.includes("Thirsty"));
    setIsActive(category.is_active !== false);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const types: string[] = [];
    if (enableRegular) types.push("Regular");
    if (enableThirsty) types.push("Thirsty");

    const targetShopId = shopId || shop?.id || user?.shop_id || "a1111111-1111-1111-1111-111111111111";

    if (editingCategory) {
      const updatedCat = await dataService.updateCategory(editingCategory.id, {
        shop_id: targetShopId,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description,
        has_regular_thirsty: hasRegularThirsty,
        regular_thirsty_types: hasRegularThirsty ? types : [],
        is_active: isActive,
      });

      setCategories((prev) =>
        prev.map((c) => (c.id === editingCategory.id ? { ...c, ...updatedCat } : c))
      );
    } else {
      const newCat = await dataService.createCategory({
        shop_id: targetShopId,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description,
        has_regular_thirsty: hasRegularThirsty,
        regular_thirsty_types: hasRegularThirsty ? types : [],
        is_active: isActive,
      });

      setCategories((prev) => [newCat, ...prev]);
    }

    setModalOpen(false);
    setEditingCategory(null);
  };

  const handleStatusChange = async (id: string, newActive: boolean) => {
    // Optimistic update
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, is_active: newActive } : cat))
    );
    try {
      await dataService.updateCategory(id, { is_active: newActive });
    } catch (err) {
      console.error("Failed to update status:", err);
      dataService.getCategories().then(setCategories);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Category Name",
      render: (c: Category) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Coffee className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white block">{c.name}</span>
            <span className="text-xs text-slate-400">{c.description || "No description"}</span>
          </div>
        </div>
      ),
    },
    {
      key: "shop_id",
      header: "Shop / Branch",
      render: (c: Category) => {
        const sName = getShopName(c.shop_id);
        const sCode = getShopCode(c.shop_id);
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900 dark:text-white">
              <Store className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{sName}</span>
              {sCode && (
                <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-mono font-bold">
                  {sCode}
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono text-slate-400 block pl-5" title={c.shop_id}>
              ID: {c.shop_id ? (c.shop_id.length > 18 ? `${c.shop_id.slice(0, 8)}...${c.shop_id.slice(-4)}` : c.shop_id) : "Default Shop"}
            </span>
          </div>
        );
      },
    },
    {
      key: "has_regular_thirsty",
      header: "Regular & Thirsty Sizing",
      render: (c: Category) =>
        c.has_regular_thirsty ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold text-xs border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Regular & Thirsty Enabled</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 font-medium">Standard Price Only</span>
        ),
    },
    {
      key: "is_active",
      header: "Status",
      render: (c: Category) => {
        const isAct = c.is_active !== false;
        return (
          <select
            value={isAct ? "ACTIVE" : "INACTIVE"}
            onChange={(e) => handleStatusChange(c.id, e.target.value === "ACTIVE")}
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
      render: (c: Category) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleOpenEdit(c)}
            title="Edit Category"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-300 dark:text-slate-400 dark:hover:text-amber-300 dark:hover:bg-amber-950/40 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Export to Excel (.csv)
  const handleExportExcel = () => {
    if (categories.length === 0) {
      alert("No categories found to export.");
      return;
    }

    const headers = [
      "Category Name",
      "Description",
      "Shop / Branch",
      "Regular & Thirsty Sizing",
      "Sizing Options",
      "Status",
    ];

    const rows = categories.map((c) => {
      const shopName = getShopName(c.shop_id);
      const sizingStr = c.has_regular_thirsty ? "Regular & Thirsty Enabled" : "Standard Price Only";
      const typesStr = c.has_regular_thirsty ? (c.regular_thirsty_types || ["Regular", "Thirsty"]).join(", ") : "-";

      return [
        `"${c.name || ''}"`,
        `"${(c.description || 'No description').replace(/"/g, '""')}"`,
        `"${shopName}"`,
        `"${sizingStr}"`,
        `"${typesStr}"`,
        `"${c.is_active !== false ? 'ACTIVE' : 'INACTIVE'}"`,
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const shopSlug = (shop?.name || "Store").replace(/[^a-zA-Z0-9_-]/g, "_");
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `Menu_Categories_${shopSlug}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (categories.length === 0) {
      alert("No categories found to export.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const shopName = shop?.name || "Tea Shop";
    const shopAddress = shop?.address || "";
    const totalCount = categories.length;
    const activeCount = categories.filter((c) => c.is_active !== false).length;
    const inactiveCount = totalCount - activeCount;

    const rowsHtml = categories
      .map((c) => {
        const branchName = getShopName(c.shop_id);
        const sizingBadge = c.has_regular_thirsty
          ? `<span class="badge sizing">Regular & Thirsty Enabled</span>`
          : `Standard Price Only`;
        const isAct = c.is_active !== false;

        return `
        <tr>
          <td><strong>${c.name}</strong><br><small style="color: #64748b;">${c.description || 'No description'}</small></td>
          <td>${branchName}</td>
          <td>${sizingBadge}</td>
          <td><span class="badge ${isAct ? 'active' : 'inactive'}">${isAct ? 'ACTIVE' : 'INACTIVE'}</span></td>
        </tr>
      `;
      })
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Menu Categories - ${shopName}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 18px; }
          .shop-title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; }
          .shop-meta { font-size: 12px; color: #64748b; margin-top: 4px; }
          .report-badge { background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 13px; display: inline-block; }
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
          .badge.sizing { background: #fef3c7; color: #92400e; }
          .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          @media print { body { padding: 0; } @page { size: portrait; margin: 12mm; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="shop-title">${shopName}</h1>
            <div class="shop-meta">${shopAddress}</div>
          </div>
          <div style="text-align: right;">
            <div class="report-badge">MENU CATEGORIES DIRECTORY</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Generated: ${new Date().toLocaleString()}</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-label">Total Categories</div>
            <div class="stat-val">${totalCount}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label" style="color: #166534;">Active Categories</div>
            <div class="stat-val" style="color: #166534;">${activeCount}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label" style="color: #991b1b;">Inactive Categories</div>
            <div class="stat-val" style="color: #991b1b;">${inactiveCount}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Shop / Branch</th>
              <th>Regular & Thirsty Sizing</th>
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
              <Boxes className="w-6 h-6 text-amber-500" />
              Menu Categories
            </h1>
            <p className="text-xs text-slate-500">
              Organize tea brews, kulhad varieties, and snacks with Regular / Thirsty pricing options
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              onClick={handleExportExcel}
              disabled={categories.length === 0}
            >
              Download Excel (.csv)
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
              onClick={handleExportPDF}
              disabled={categories.length === 0}
            >
              Download PDF
            </Button>
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd}>
              Add Category
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={categories}
          searchKey="name"
          searchPlaceholder="Search menu categories..."
        />
      </div>

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCategory(null);
        }}
        title={editingCategory ? "Edit Menu Category" : "Add Menu Category"}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Shop Selection & ID Display */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Target Shop / Branch
              </span>
              {selectedShop?.shop_code && (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono text-xs font-bold">
                  {selectedShop.shop_code}
                </span>
              )}
            </div>

            {shops.length > 1 ? (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Select Shop Branch
                </label>
                <select
                  value={shopId}
                  onChange={(e) => setShopId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.shop_code || s.id.slice(0, 8)})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Shop Name</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedShop?.name || shop?.name || "Chai Craft Artisan Bar"}
                  </span>
                </div>
              </div>
            )}

            {/* Resolved Shop ID display */}
            <div className="pt-2 border-t border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">
                Shop Name (Resolved): <strong className="text-slate-900 dark:text-white">{selectedShop?.name || getShopName(shopId)}</strong>
              </span>
              <span className="font-mono text-slate-400 text-[10px]" title={shopId}>
                ID: {shopId}
              </span>
            </div>
          </div>

          <Input
            label="Category Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Kulhad Special Tea"
            required
          />

          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Slow-cooked authentic Assam leaf tea with roasted spices"
          />

          {/* Regular & Thirsty Checkbox Section */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={hasRegularThirsty}
                onChange={(e) => setHasRegularThirsty(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Enable Regular & Thirsty Sizes for this Category
              </span>
            </label>
            <p className="text-[11px] text-slate-500 pl-6 leading-relaxed">
              When enabled, products under this category will automatically prompt for <strong>Regular Price</strong> and <strong>Thirsty Price</strong>.
            </p>

            {hasRegularThirsty && (
              <div className="flex gap-4 pt-2 pl-6 border-t border-amber-500/20">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={enableRegular}
                    onChange={(e) => setEnableRegular(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-amber-600"
                  />
                  <span>Regular Size</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={enableThirsty}
                    onChange={(e) => setEnableThirsty(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-amber-600"
                  />
                  <span>Thirsty Size</span>
                </label>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</span>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-600">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600"
              />
              <span>Active on Menu</span>
            </label>
          </div>

          <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                setEditingCategory(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              {editingCategory ? "Update Category" : "Save Category"}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
};
export default CategoryList;
