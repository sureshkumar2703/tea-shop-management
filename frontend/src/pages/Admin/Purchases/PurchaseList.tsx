import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Purchase, Product } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getPdfWatermarkCss, getPdfWatermarkHtml, getPdfHeaderHtml } from "@/lib/pdfUtils";
import {
  Plus,
  Truck,
  Package,
  Building2,
  Calendar,
  QrCode,
  Banknote,
  Boxes,
  Check,
  AlertCircle,
  Download,
  FileSpreadsheet,
  FileText,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { dataService } from "@/services/supabaseService";

export const PurchaseList: React.FC = () => {
  const { shop } = useAuthStore();
  const shopId = shop?.id || "a1111111-1111-1111-1111-111111111111";
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [addedStockIds, setAddedStockIds] = useState<string[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Tab State: "PENDING" (Add Stock btn active) vs "COMPLETED" (Stock Added btn disabled) vs "ALL"
  const [activeTab, setActiveTab] = useState<"PENDING" | "COMPLETED" | "ALL">("PENDING");

  // Fallback modal if product name doesn't auto-match
  const [manualMatchModalOpen, setManualMatchModalOpen] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState<Purchase | null>(null);
  const [manualSelectedProductId, setManualSelectedProductId] = useState("");

  const loadData = async () => {
    const [purchs, prods] = await Promise.all([
      dataService.getPurchases(shopId),
      dataService.getProducts(shopId),
    ]);
    setPurchases(purchs || []);
    setProducts(prods || []);
  };

  useEffect(() => {
    loadData();
  }, [shopId]);

  const markStockAdded = async (purchaseId: string) => {
    setAddedStockIds((prev) => Array.from(new Set([...prev, purchaseId])));
    setPurchases((prev) =>
      prev.map((p) => (p.id === purchaseId ? { ...p, stock_added: true } : p))
    );
    await dataService.updatePurchaseStockAdded(purchaseId, true);
  };

  const isPurchaseStockAdded = (p: Purchase) => {
    return !!p.stock_added || addedStockIds.includes(p.id);
  };

  const getPurchaseDetails = (p: Purchase) => {
    let prod = p.product_name || "";
    let qty = p.total_qty || 0;

    if (!prod && p.notes) {
      if (p.notes.includes("Item:")) {
        const itemPart = p.notes.split("|").find((s) => s.includes("Item:"));
        if (itemPart) prod = itemPart.replace("Item:", "").trim();
      } else {
        prod = p.notes.split("|")[0].trim();
      }
    }

    if (!qty && p.notes && p.notes.includes("Qty:")) {
      const qtyPart = p.notes.split("|").find((s) => s.includes("Qty:"));
      if (qtyPart) qty = parseFloat(qtyPart.replace("Qty:", "").trim()) || 0;
    }

    return {
      productName: prod,
      quantity: qty > 0 ? qty : 1,
    };
  };

  // Filtered Purchases based on active tab
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const added = isPurchaseStockAdded(p);
      if (activeTab === "PENDING") return !added;
      if (activeTab === "COMPLETED") return added;
      return true;
    });
  }, [purchases, addedStockIds, activeTab]);

  const pendingCount = useMemo(() => {
    return purchases.filter((p) => !isPurchaseStockAdded(p)).length;
  }, [purchases, addedStockIds]);

  const completedCount = useMemo(() => {
    return purchases.filter((p) => isPurchaseStockAdded(p)).length;
  }, [purchases, addedStockIds]);

  const handleAddStock = async (p: Purchase) => {
    const { productName, quantity } = getPurchaseDetails(p);

    if (!productName) {
      setPendingPurchase(p);
      if (products[0]) setManualSelectedProductId(products[0].id);
      setManualMatchModalOpen(true);
      return;
    }

    const matchedProduct = products.find(
      (prod) =>
        prod.name.trim().toLowerCase() === productName.trim().toLowerCase() ||
        prod.name.toLowerCase().includes(productName.toLowerCase()) ||
        productName.toLowerCase().includes(prod.name.toLowerCase())
    );

    if (!matchedProduct) {
      setPendingPurchase(p);
      if (products[0]) setManualSelectedProductId(products[0].id);
      setManualMatchModalOpen(true);
      return;
    }

    setLoadingId(p.id);
    try {
      const currentStock = matchedProduct.stock_quantity ?? 0;
      const updatedStock = currentStock + quantity;

      await dataService.updateProductStock(
        matchedProduct.id,
        updatedStock,
        matchedProduct.available_weight
      );

      setProducts((prev) =>
        prev.map((prod) =>
          prod.id === matchedProduct.id
            ? { ...prod, stock_quantity: updatedStock, track_stock: true, is_unlimited: false }
            : prod
        )
      );

      markStockAdded(p.id);
      alert(`✅ Stock Added Successfully!\n\nProduct: "${matchedProduct.name}"\nAdded: +${quantity} units\nNew Total Stock: ${updatedStock} units`);
    } catch (err) {
      console.error("Failed to add stock:", err);
      alert("Failed to update stock in database. Please try again.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleConfirmManualMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingPurchase || !manualSelectedProductId) return;

    const matchedProduct = products.find((p) => p.id === manualSelectedProductId);
    if (!matchedProduct) return;

    const { quantity } = getPurchaseDetails(pendingPurchase);

    setLoadingId(pendingPurchase.id);
    try {
      const currentStock = matchedProduct.stock_quantity ?? 0;
      const updatedStock = currentStock + quantity;

      await dataService.updateProductStock(
        matchedProduct.id,
        updatedStock,
        matchedProduct.available_weight
      );

      setProducts((prev) =>
        prev.map((prod) =>
          prod.id === matchedProduct.id
            ? { ...prod, stock_quantity: updatedStock, track_stock: true, is_unlimited: false }
            : prod
        )
      );

      markStockAdded(pendingPurchase.id);
      setManualMatchModalOpen(false);
      setPendingPurchase(null);
      alert(`✅ Stock Added Successfully!\n\nProduct: "${matchedProduct.name}"\nAdded: +${quantity} units\nNew Total Stock: ${updatedStock} units`);
    } catch (err) {
      console.error("Failed to add stock:", err);
      alert("Failed to update stock. Please try again.");
    } finally {
      setLoadingId(null);
    }
  };

  // EXPORT TO EXCEL / CSV
  const handleDownloadExcel = () => {
    if (filteredPurchases.length === 0) {
      alert("No purchase data available to download.");
      return;
    }

    const headers = [
      "Invoice Number",
      "Purchase Date",
      "Vendor / Supplier",
      "Product Name",
      "Quantity",
      "Payment Method",
      "Total Amount (INR)",
      "Payment Status",
      "Stock Status",
    ];

    const rows = filteredPurchases.map((p) => {
      const { productName, quantity } = getPurchaseDetails(p);
      const isAdded = isPurchaseStockAdded(p);
      const vendorName = p.supplier_name || p.supplier?.name || "Local Vendor";
      const payMethod = p.payment_method === "UPI_QR" ? "UPI / GPay" : "Cash";

      return [
        `"${p.invoice_number || "N/A"}"`,
        `"${p.purchase_date}"`,
        `"${vendorName.replace(/"/g, '""')}"`,
        `"${(productName || "General Supplies").replace(/"/g, '""')}"`,
        quantity,
        `"${payMethod}"`,
        p.total_amount || 0,
        `"${p.payment_status || "PAID"}"`,
        `"${isAdded ? "Stock Added" : "Pending Stock Addition"}"`,
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `purchases_${activeTab.toLowerCase()}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // EXPORT TO PDF / PRINT REPORT
  const handleDownloadPDF = () => {
    if (filteredPurchases.length === 0) {
      alert("No purchase data available to download.");
      return;
    }

    const totalSpent = filteredPurchases.reduce((sum, p) => sum + (p.total_amount || 0), 0);
    const tabName =
      activeTab === "PENDING"
        ? "Pending Stock Inward"
        : activeTab === "COMPLETED"
        ? "Stock Added Inward"
        : "All Inward Purchases";

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to download/print the PDF report.");
      return;
    }

    const tableRowsHtml = filteredPurchases
      .map((p, idx) => {
        const { productName, quantity } = getPurchaseDetails(p);
        const isAdded = isPurchaseStockAdded(p);
        const vendorName = p.supplier_name || p.supplier?.name || "Local Vendor";
        const payMethod = p.payment_method === "UPI_QR" ? "UPI / GPay" : "Cash";

        return `
        <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 0 ? "background-color: #f8fafc;" : ""}">
          <td style="padding: 8px 10px; font-weight: 600;">${p.invoice_number || "N/A"}</td>
          <td style="padding: 8px 10px;">${p.purchase_date}</td>
          <td style="padding: 8px 10px;">${vendorName}</td>
          <td style="padding: 8px 10px; font-weight: 600;">${productName || "General Supplies"}</td>
          <td style="padding: 8px 10px; text-align: center;">${quantity}</td>
          <td style="padding: 8px 10px;">${payMethod}</td>
          <td style="padding: 8px 10px; text-align: right; font-weight: 700;">₹${(p.total_amount || 0).toFixed(2)}</td>
          <td style="padding: 8px 10px; text-align: center;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; ${
              isAdded
                ? "background-color: #dcfce7; color: #15803d;"
                : "background-color: #fef3c7; color: #b45309;"
            }">
              ${isAdded ? "✓ Added" : "Pending"}
            </span>
          </td>
        </tr>
      `;
      })
      .join("");

    const shopName = shop?.name || "Tea Shop";
    const shopAddress = shop?.address || "";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Purchases Report - ${tabName} - ${shopName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 25px; color: #1e293b; position: relative; }
          .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 15px; }
          th { background-color: #f1f5f9; padding: 10px; text-align: left; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1; }
          .footer-summary { margin-top: 25px; display: flex; justify-content: flex-end; }
          .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; min-width: 260px; }
          ${getPdfWatermarkCss()}
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        ${getPdfWatermarkHtml(shopName, shop?.logo_url)}
        ${getPdfHeaderHtml(shopName, shopAddress, `PURCHASES INWARD (${tabName})`, shop?.logo_url)}

        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Vendor</th>
              <th>Product Name</th>
              <th style="text-align: center;">Qty</th>
              <th>Payment</th>
              <th style="text-align: right;">Amount (₹)</th>
              <th style="text-align: center;">Stock Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="footer-summary">
          <div class="summary-card">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; color: #64748b;">
              <span>Total Inward Invoices:</span>
              <strong>${filteredPurchases.length}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; color: #d97706; border-top: 1px solid #e2e8f0; padding-top: 8px;">
              <span>Total Amount:</span>
              <span>₹${totalSpent.toFixed(2)}</span>
            </div>
          </div>
        </div>

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

  const columns = [
    {
      key: "invoice_number",
      header: "Invoice & Date",
      render: (p: Purchase) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-900 dark:text-white block">{p.invoice_number || "N/A"}</span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            {formatDate(p.purchase_date)}
          </span>
        </div>
      ),
    },
    {
      key: "supplier",
      header: "Vendor / Supplier",
      render: (p: Purchase) => {
        const vendorName = p.supplier_name || p.supplier?.name || "Local Vendor";
        return (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">{vendorName}</span>
          </div>
        );
      },
    },
    {
      key: "product_name",
      header: "Product & Quantity",
      render: (p: Purchase) => {
        const { productName, quantity } = getPurchaseDetails(p);
        return (
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold border border-amber-500/20">
              <Package className="w-3.5 h-3.5" />
              <span>{productName || "General Supplies"}</span>
            </div>
            {quantity > 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                Qty: <strong>{quantity}</strong>
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "payment_method",
      header: "Payment Method",
      render: (p: Purchase) => (
        <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
          {p.payment_method === "UPI_QR" ? (
            <>
              <QrCode className="w-3.5 h-3.5 text-amber-500" />
              <span>Google Pay / UPI</span>
            </>
          ) : (
            <>
              <Banknote className="w-3.5 h-3.5 text-emerald-500" />
              <span>Cash</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: "total_amount",
      header: "Invoice Total",
      render: (p: Purchase) => (
        <span className="font-bold text-sm text-slate-900 dark:text-white">{formatCurrency(p.total_amount)}</span>
      ),
    },
    {
      key: "payment_status",
      header: "Status",
      render: (p: Purchase) => <Badge variant="success">{p.payment_status || "PAID"}</Badge>,
    },
    {
      key: "action",
      header: "Action",
      render: (p: Purchase) => {
        const isAdded = isPurchaseStockAdded(p);
        if (isAdded) {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <Check className="w-3.5 h-3.5" /> Stock Added
            </span>
          );
        }

        return (
          <Button
            size="sm"
            variant="primary"
            icon={<Boxes className="w-3.5 h-3.5" />}
            onClick={() => handleAddStock(p)}
            isLoading={loadingId === p.id}
            className="text-xs font-bold shadow-sm"
          >
            Add Stock
          </Button>
        );
      },
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with Record Purchase and Export Options */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-6 h-6 text-amber-500" />
              Inventory Inward Purchases
            </h1>
            <p className="text-xs text-slate-500">Track supplier shipments, inward invoices, and apply received stock to products</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Export Buttons */}
            <Button
              variant="secondary"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              onClick={handleDownloadExcel}
              className="text-xs font-semibold"
            >
              Export Excel
            </Button>
            <Button
              variant="secondary"
              icon={<FileText className="w-4 h-4 text-rose-600" />}
              onClick={handleDownloadPDF}
              className="text-xs font-semibold"
            >
              Export PDF
            </Button>
            <Link to="/admin/purchases/new">
              <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
                Record Purchase
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Filters: Pending vs Stock Added vs All */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => setActiveTab("PENDING")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer select-none active:scale-95 ${
              activeTab === "PENDING"
                ? "bg-amber-600 text-white shadow-sm shadow-amber-600/30"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-amber-400"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Stock Addition (Add Stock Active)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeTab === "PENDING" ? "bg-white/25 text-white" : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
              }`}
            >
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("COMPLETED")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer select-none active:scale-95 ${
              activeTab === "COMPLETED"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-400"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Stock Added (Disabled / Completed)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeTab === "COMPLETED" ? "bg-white/25 text-white" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
              }`}
            >
              {completedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer select-none active:scale-95 ${
              activeTab === "ALL"
                ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-400"
            }`}
          >
            <span>All Purchases</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
              {purchases.length}
            </span>
          </button>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={filteredPurchases}
          searchKey="invoice_number"
          searchPlaceholder="Search invoices by number or vendor..."
        />
      </div>

      {/* Manual Product Match Modal */}
      {pendingPurchase && (
        <Modal
          isOpen={manualMatchModalOpen}
          onClose={() => {
            setManualMatchModalOpen(false);
            setPendingPurchase(null);
          }}
          title="Select Product to Add Stock"
          size="md"
        >
          <form onSubmit={handleConfirmManualMatch} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Inward Shipment Details</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Invoice: <strong>{pendingPurchase.invoice_number}</strong> | Vendor: <strong>{pendingPurchase.supplier_name || pendingPurchase.supplier?.name || "Local Vendor"}</strong>
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Item in Invoice: <strong>{getPurchaseDetails(pendingPurchase).productName || "General Item"}</strong> (Qty: <strong>{getPurchaseDetails(pendingPurchase).quantity}</strong>)
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Choose Product from Catalog to Increase Stock:
              </label>
              <select
                value={manualSelectedProductId}
                onChange={(e) => setManualSelectedProductId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              >
                <option value="">Select a product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Current Stock: {p.stock_quantity ?? 0} Qty)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setManualMatchModalOpen(false);
                  setPendingPurchase(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={loadingId === pendingPurchase.id}
                className="flex-1"
              >
                Confirm & Add Stock
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
};
export default PurchaseList;
