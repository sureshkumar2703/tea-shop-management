import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ReceiptModal } from "@/components/modals/ReceiptModal";
import { dataService } from "@/services/supabaseService";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { Order, Expense, Datepay } from "@/types";
import { formatCurrency, formatDate, formatDateTime, getLocalDateStr, isSameLocalDate } from "@/lib/utils";
import { getPdfWatermarkCss, getPdfWatermarkHtml, getPdfHeaderHtml } from "@/lib/pdfUtils";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Coffee,
  CheckCircle2,
  Clock,
  Layers,
  Banknote,
  QrCode,
  FileText,
  FileSpreadsheet,
  Filter,
  RotateCcw,
  Printer,
  Phone,
  User as UserIcon,
  UserCheck,
} from "lucide-react";

type ReportPeriod =
  | "DAY"
  | "WEEK"
  | "MONTH"
  | "YEAR"
  | "SELECTED_MONTH"
  | "SELECTED_YEAR"
  | "OVERALL";

export const ReportsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { shop, user } = useAuthStore();
  const cartStore = useCartStore();

  const currentShopId = shop?.id || user?.shop_id;

  const [activePeriod, setActivePeriod] = useState<ReportPeriod>("DAY");

  // Print modal state
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState<boolean>(false);

  // Filter pickers using local system date
  const [selectedDay, setSelectedDay] = useState<string>(getLocalDateStr(new Date()));
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedMonthYear, setSelectedMonthYear] = useState<number>(new Date().getFullYear());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [datepays, setDatepays] = useState<Datepay[]>([]);

  useEffect(() => {
    dataService.getOrders(currentShopId).then(setOrders);
    dataService.getExpenses(currentShopId).then(setExpenses);
    dataService.getDatepays(currentShopId).then(setDatepays);
  }, [currentShopId]);

  // Filter calculations based on activePeriod in local timezone
  const getFilteredData = () => {
    let filteredOrders: Order[] = [];
    let filteredExpenses: Expense[] = [];
    let label = "";

    const now = new Date();

    if (activePeriod === "DAY") {
      filteredOrders = orders.filter(
        (o) => (isSameLocalDate(o.created_at, selectedDay) || o.created_at?.startsWith(selectedDay)) && (o.status === "COMPLETED" || !o.status)
      );
      filteredExpenses = expenses.filter(
        (e) => isSameLocalDate(e.expense_date, selectedDay) || isSameLocalDate(e.created_at, selectedDay) || e.expense_date === selectedDay
      );
      label = `Day Report: ${formatDate(selectedDay)}`;
    } else if (activePeriod === "WEEK") {
      const d = new Date(now);
      const day = d.getDay();
      const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diffToMonday));
      const mondayStr = getLocalDateStr(monday);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const sundayStr = getLocalDateStr(sunday);

      filteredOrders = orders.filter((o) => {
        const loc = getLocalDateStr(o.created_at);
        return loc >= mondayStr && loc <= sundayStr && (o.status === "COMPLETED" || !o.status);
      });
      filteredExpenses = expenses.filter((e) => {
        const loc = getLocalDateStr(e.expense_date || e.created_at);
        return loc >= mondayStr && loc <= sundayStr;
      });
      label = `Current Week Report (${formatDate(mondayStr)} - ${formatDate(sundayStr)})`;
    } else if (activePeriod === "MONTH") {
      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      filteredOrders = orders.filter((o) => {
        const loc = getLocalDateStr(o.created_at);
        return (loc.startsWith(currentMonthStr) || o.created_at?.startsWith(currentMonthStr)) && (o.status === "COMPLETED" || !o.status);
      });
      filteredExpenses = expenses.filter((e) => {
        const loc = getLocalDateStr(e.expense_date || e.created_at);
        return loc.startsWith(currentMonthStr) || e.expense_date?.startsWith(currentMonthStr);
      });
      label = `Current Month Report: ${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`;
    } else if (activePeriod === "YEAR") {
      const currentYearStr = `${now.getFullYear()}`;
      filteredOrders = orders.filter((o) => {
        const loc = getLocalDateStr(o.created_at);
        return (loc.startsWith(currentYearStr) || o.created_at?.startsWith(currentYearStr)) && (o.status === "COMPLETED" || !o.status);
      });
      filteredExpenses = expenses.filter((e) => {
        const loc = getLocalDateStr(e.expense_date || e.created_at);
        return loc.startsWith(currentYearStr) || e.expense_date?.startsWith(currentYearStr);
      });
      label = `Current Year Report: ${now.getFullYear()}`;
    } else if (activePeriod === "SELECTED_MONTH") {
      const monthPrefix = `${selectedMonthYear}-${String(selectedMonth).padStart(2, "0")}`;
      filteredOrders = orders.filter((o) => {
        const loc = getLocalDateStr(o.created_at);
        return (loc.startsWith(monthPrefix) || o.created_at?.startsWith(monthPrefix)) && (o.status === "COMPLETED" || !o.status);
      });
      filteredExpenses = expenses.filter((e) => {
        const loc = getLocalDateStr(e.expense_date || e.created_at);
        return loc.startsWith(monthPrefix) || e.expense_date?.startsWith(monthPrefix);
      });
      const monthName = new Date(selectedMonthYear, selectedMonth - 1).toLocaleString("default", {
        month: "long",
      });
      label = `Selected Month Report: ${monthName} ${selectedMonthYear}`;
    } else if (activePeriod === "SELECTED_YEAR") {
      const yearPrefix = `${selectedYear}`;
      filteredOrders = orders.filter((o) => {
        const loc = getLocalDateStr(o.created_at);
        return (loc.startsWith(yearPrefix) || o.created_at?.startsWith(yearPrefix)) && (o.status === "COMPLETED" || !o.status);
      });
      filteredExpenses = expenses.filter((e) => {
        const loc = getLocalDateStr(e.expense_date || e.created_at);
        return loc.startsWith(yearPrefix) || e.expense_date?.startsWith(yearPrefix);
      });
      label = `Selected Year Report: Year ${selectedYear}`;
    } else if (activePeriod === "OVERALL") {
      filteredOrders = orders.filter((o) => o.status === "COMPLETED" || !o.status);
      filteredExpenses = expenses;
      label = "Overall Lifetime Report (All-Time)";
    }

    const totalBilling = filteredOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const cashBilling = filteredOrders.reduce((sum, o) => {
      if (o.payment_method === "CASH") return sum + o.total_amount;
      if (o.payment_method === "SPLIT") return sum + (o.cash_amount || 0);
      return sum;
    }, 0);
    const gpayBilling = filteredOrders.reduce((sum, o) => {
      if (o.payment_method === "UPI_QR") return sum + o.total_amount;
      if (o.payment_method === "SPLIT") return sum + (o.gpay_amount || 0);
      return sum;
    }, 0);
    const totalExpenses = filteredExpenses.reduce(
      (sum, e) =>
        sum +
        (e.status === "COMPLETED" && e.bill_amount !== undefined && e.bill_amount > 0
          ? Number(e.bill_amount)
          : Number(e.amount || 0)),
      0
    );
    const netProfit = totalBilling - totalExpenses;

    return {
      filteredOrders,
      filteredExpenses,
      label,
      totalBilling,
      cashBilling,
      gpayBilling,
      totalExpenses,
      netProfit,
    };
  };

  const report = getFilteredData();

  // EXPORT DETAILED BILLS TO EXCEL (.csv)
  const handleExportExcel = () => {
    if (report.filteredOrders.length === 0) {
      alert("No bill records available to export for this period.");
      return;
    }

    const headers = [
      "Bill No",
      "Date & Time",
      "Customer Name",
      "Phone Number",
      "Order Type",
      "Payment Method",
      "Total Amount (INR)",
      "Received Amount (INR)",
      "Balance Amount (INR)",
      "Cash Portion (INR)",
      "UPI Portion (INR)",
      "Bill Created / Cashier",
      "Status",
    ];

    const rows = report.filteredOrders.map((o) => {
      const receivedAmount =
        o.received_amount !== undefined
          ? o.received_amount
          : o.payment_method === "SPLIT"
          ? (o.cash_amount || 0) + (o.gpay_amount || 0)
          : o.payment_method === "CASH"
          ? o.cash_amount || o.total_amount
          : o.gpay_amount || o.total_amount;

      const balanceAmount =
        o.balance_amount !== undefined
          ? o.balance_amount
          : Math.max(0, receivedAmount - o.total_amount);

      const cashierDisplay = o.cashier_name || o.cashier?.full_name || "Admin";

      const payMethodStr =
        o.payment_method === "SPLIT"
          ? "Split (Cash + UPI)"
          : o.payment_method === "UPI_QR"
          ? "Google Pay / UPI"
          : "Cash";

      return [
        `"${o.order_number}"`,
        `"${formatDateTime(o.created_at)}"`,
        `"${(o.customer_name || "Walk-in Guest").replace(/"/g, '""')}"`,
        `"${o.customer_phone || ""}"`,
        `"${o.order_type || "DINE_IN"}"`,
        `"${payMethodStr}"`,
        o.total_amount || 0,
        receivedAmount || 0,
        balanceAmount || 0,
        o.cash_amount || (o.payment_method === "CASH" ? o.total_amount : 0),
        o.gpay_amount || (o.payment_method === "UPI_QR" ? o.total_amount : 0),
        `"${cashierDisplay.replace(/"/g, '""')}"`,
        `"${o.status || "COMPLETED"}"`,
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const cleanLabel = (report.label || activePeriod).replace(/[^a-zA-Z0-9_-]/g, "_");
    link.setAttribute(
      "download",
      `Detailed_Bills_Log_${cleanLabel}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // EXPORT DETAILED BILLS TO PDF REPORT
  const handleExportPDF = () => {
    if (report.filteredOrders.length === 0) {
      alert("No bill records available to export for this period.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to generate and print the PDF report.");
      return;
    }

    const totalBills = report.filteredOrders.length;
    const totalRevenue = report.totalBilling;
    const totalCash = report.cashBilling;
    const totalUpi = report.gpayBilling;

    const tableRowsHtml = report.filteredOrders
      .map((o, idx) => {
        const timeStr = new Date(o.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        const dateStr = formatDate(o.created_at);

        const receivedAmount =
          o.received_amount !== undefined
            ? o.received_amount
            : o.payment_method === "SPLIT"
            ? (o.cash_amount || 0) + (o.gpay_amount || 0)
            : o.payment_method === "CASH"
            ? o.cash_amount || o.total_amount
            : o.gpay_amount || o.total_amount;

        const balanceAmount =
          o.balance_amount !== undefined
            ? o.balance_amount
            : Math.max(0, receivedAmount - o.total_amount);

        const cashierDisplay = o.cashier_name || o.cashier?.full_name || "Admin";

        const payMethod =
          o.payment_method === "SPLIT"
            ? `Split (Cash: ₹${o.cash_amount || 0} + UPI: ₹${o.gpay_amount || 0})`
            : o.payment_method === "UPI_QR"
            ? "Google Pay / UPI"
            : "Cash";

        return `
          <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 0 ? "background-color: #f8fafc;" : ""}">
            <td style="padding: 8px 10px; font-weight: 700; font-family: monospace;">${o.order_number}</td>
            <td style="padding: 8px 10px; white-space: nowrap;">${dateStr}<br/><span style="color: #64748b; font-size: 11px;">${timeStr}</span></td>
            <td style="padding: 8px 10px;">
              <strong>${o.customer_name || "Walk-in Guest"}</strong>
              ${o.customer_phone ? `<br/><span style="color: #d97706; font-size: 11px;">${o.customer_phone}</span>` : ""}
            </td>
            <td style="padding: 8px 10px; text-align: center;">
              <span style="padding: 2px 6px; background: #e2e8f0; border-radius: 4px; font-size: 10px; font-weight: bold;">${o.order_type || "DINE_IN"}</span>
            </td>
            <td style="padding: 8px 10px;">${payMethod}</td>
            <td style="padding: 8px 10px; text-align: right; font-weight: 800; color: #b45309;">₹${(o.total_amount || 0).toFixed(2)}</td>
            <td style="padding: 8px 10px; text-align: right; font-weight: 700; color: #15803d;">₹${Number(receivedAmount).toFixed(2)}</td>
            <td style="padding: 8px 10px; text-align: right; color: #64748b;">₹${Number(balanceAmount).toFixed(2)}</td>
            <td style="padding: 8px 10px; font-size: 11px;">${cashierDisplay}</td>
          </tr>
        `;
      })
      .join("");

    const shopName = shop?.name || "Tea Shop";
    const shopAddress = `${shop?.address || "Store Branch"} | Phone: ${shop?.phone || "N/A"} ${shop?.gst_number ? `| GSTIN: ${shop.gst_number}` : ""}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Detailed Bills Log Report - ${shopName}</title>
        <style>
          body { font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #0f172a; margin: 0; position: relative; }
          .shop-title { font-size: 20px; font-weight: 800; color: #b45309; }
          .report-badge { background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 14px; border-radius: 8px; }
          .summary-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; }
          .summary-val { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #f1f5f9; padding: 9px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; }
          .footer { margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
          ${getPdfWatermarkCss()}
          @media print {
            body { padding: 0; }
            @page { margin: 12mm; size: landscape; }
          }
        </style>
      </head>
      <body>
        ${getPdfWatermarkHtml(shopName, shop?.logo_url)}
        ${getPdfHeaderHtml(shopName, shopAddress, `DETAILED BILLS AUDIT (${report.label})`, shop?.logo_url)}

        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-label">Total Bills</div>
            <div class="summary-val">${totalBills} Orders</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Total Sales Revenue</div>
            <div class="summary-val" style="color: #b45309;">₹${totalRevenue.toFixed(2)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Cash Collections</div>
            <div class="summary-val" style="color: #15803d;">₹${totalCash.toFixed(2)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">UPI / GPay Collections</div>
            <div class="summary-val" style="color: #0284c7;">₹${totalUpi.toFixed(2)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Bill No</th>
              <th>Date & Time</th>
              <th>Customer / Contact</th>
              <th style="text-align: center;">Type</th>
              <th>Payment Channel</th>
              <th style="text-align: right;">Total (₹)</th>
              <th style="text-align: right;">Received (₹)</th>
              <th style="text-align: right;">Balance (₹)</th>
              <th>Cashier</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="footer">
          This is an official system generated bill log statement from ${shop?.name || "Chai Craft POS"}.
        </div>

        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleRebill = (order: Order) => {
    cartStore.clearCart();
    cartStore.setCustomerInfo(order.customer_name || "Walk-in Guest", order.customer_phone || "");
    cartStore.setOrderType(order.order_type || "DINE_IN");
    if (order.discount_amount) {
      cartStore.setDiscount(order.discount_amount, order.discount_reason || "");
    }

    if (order.items && order.items.length > 0) {
      order.items.forEach((item) => {
        cartStore.addCustomItem({
          product: {
            id: item.product_id || `prod-${Date.now()}`,
            name: item.product_name,
            base_price: item.unit_price,
            category: "General",
            is_active: true,
          } as any,
          variantName: item.variant_name,
          sizeVariant: item.size_variant,
          unitMode: item.unit_mode || "QTY",
          weightGrams: item.weight_grams,
          weightKg: item.weight_kg,
          unitPrice: item.unit_price,
          quantity: item.quantity,
          addons: (item.addons || []).map((a) => ({
            id: a.id,
            name: (a as any).addon_name || (a as any).name || "Addon",
            price: a.price,
          })),
          notes: item.notes,
        });
      });
    }

    navigate("/admin/billing");
  };

  const handlePrint = (order: Order) => {
    setSelectedOrderForPrint(order);
    setPrintModalOpen(true);
  };

  const tabs: { id: ReportPeriod; label: string }[] = [
    { id: "DAY", label: "Day Report" },
    { id: "WEEK", label: "Week Report" },
    { id: "MONTH", label: "Month Report" },
    { id: "YEAR", label: "Year Report" },
    { id: "SELECTED_MONTH", label: "Selected Month" },
    { id: "SELECTED_YEAR", label: "Selected Year" },
    { id: "OVERALL", label: "Overall Report" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-amber-500" />
              Tea Shop Financial & Sales Reports
            </h1>
            <p className="text-xs text-slate-500">
              Individual reports for Day, Week, Month, Year, Custom Selected Month / Year, and Overall Performance
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
              onClick={() => navigate("/admin/reports/user-bills")}
            >
              User Bill Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              onClick={handleExportExcel}
            >
              Export Excel (.csv)
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
              onClick={handleExportPDF}
            >
              Export PDF
            </Button>
          </div>
        </div>

        {/* 7 INDIVIDUAL REPORT NAVIGATION TABS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActivePeriod(tab.id)}
              className={`px-4 py-2 text-xs font-bold whitespace-nowrap rounded-xl transition-all ${
                activePeriod === tab.id
                  ? "bg-amber-600 text-white shadow-sm shadow-amber-600/30"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-amber-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* PERIOD-SPECIFIC CONTROLS & DATE PICKERS */}
        <Card className="p-4 bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Active View:
              </span>
              <Badge variant="warning">{report.label}</Badge>
            </div>

            {/* If Day Report is selected -> show Day Picker */}
            {activePeriod === "DAY" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Select Day:</span>
                <input
                  type="date"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                />
              </div>
            )}

            {/* If Selected Month is chosen -> show Month & Year pickers */}
            {activePeriod === "SELECTED_MONTH" && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                >
                  {[
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                  ].map((m, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedMonthYear}
                  onChange={(e) => setSelectedMonthYear(parseInt(e.target.value))}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* If Selected Year is chosen -> show Year picker */}
            {activePeriod === "SELECTED_YEAR" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Select Year:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      Year {y}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </Card>

        {/* 4 Financial Stat Cards for the active view */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Billing Sales"
            value={formatCurrency(report.totalBilling)}
            icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
            subtitle={`${report.filteredOrders.length} Bills Generated`}
            color="emerald"
          />
          <StatCard
            title="Cash Billing Sales"
            value={formatCurrency(report.cashBilling)}
            icon={<Banknote className="w-5 h-5 text-emerald-500" />}
            subtitle="Cash in drawer"
            color="emerald"
          />
          <StatCard
            title="Google Pay / UPI Sales"
            value={formatCurrency(report.gpayBilling)}
            icon={<QrCode className="w-5 h-5 text-amber-500" />}
            subtitle="Digital collections"
            color="amber"
          />
          <StatCard
            title="Net Profit (Sales - Expenses)"
            value={formatCurrency(report.netProfit)}
            icon={<DollarSign className="w-5 h-5 text-purple-500" />}
            subtitle={`Expenses: -${formatCurrency(report.totalExpenses)}`}
            color="purple"
          />
        </div>

        {/* Report Orders & Items Table */}
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Detailed Bills Log ({report.filteredOrders.length} Orders)
              </h2>
              <p className="text-xs text-slate-500">
                Line-item audit of customer bills, payment channels, timestamps, and quick print/rebill actions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                onClick={handleExportExcel}
              >
                Download Excel (.csv)
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                onClick={handleExportPDF}
              >
                Download PDF
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 whitespace-nowrap">
                <tr>
                  <th className="px-3.5 py-3">Bill No</th>
                  <th className="px-3.5 py-3">Time</th>
                  <th className="px-3.5 py-3">Customer / Phone</th>
                  <th className="px-3.5 py-3">Type</th>
                  <th className="px-3.5 py-3">Payment Method</th>
                  <th className="px-3.5 py-3 text-right">Total Amount</th>
                  <th className="px-3.5 py-3 text-right">Received Amount</th>
                  <th className="px-3.5 py-3 text-right">Balance Amount</th>
                  <th className="px-3.5 py-3">Bill Created / Cashier</th>
                  <th className="px-3.5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {report.filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-xs text-slate-400">
                      No customer bills recorded for this period.
                    </td>
                  </tr>
                ) : (
                  report.filteredOrders.map((o) => {
                    const timeStr = new Date(o.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    });

                    // Received & Balance amount calculations
                    const receivedAmount =
                      o.received_amount !== undefined
                        ? o.received_amount
                        : o.payment_method === "SPLIT"
                        ? (o.cash_amount || 0) + (o.gpay_amount || 0)
                        : o.payment_method === "CASH"
                        ? o.cash_amount || o.total_amount
                        : o.gpay_amount || o.total_amount;

                    const balanceAmount =
                      o.balance_amount !== undefined
                        ? o.balance_amount
                        : Math.max(0, receivedAmount - o.total_amount);

                    const cashierDisplay = o.cashier_name || o.cashier?.full_name || "Admin";

                    return (
                      <tr key={o.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        {/* 1. Bill No + Cashier */}
                        <td className="px-3.5 py-3 font-mono text-xs whitespace-nowrap">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {o.order_number}
                          </span>
                          <span className="text-[10px] font-sans font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                            <UserIcon className="w-2.5 h-2.5" />
                            {cashierDisplay}
                          </span>
                        </td>

                        {/* 2. Time */}
                        <td className="px-3.5 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {timeStr}
                        </td>

                        {/* 3. Customer / Phone */}
                        <td className="px-3.5 py-3 text-xs">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {o.customer_name || "Walk-in Guest"}
                            </span>
                            {o.customer_phone ? (
                              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5" />
                                {o.customer_phone}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">—</span>
                            )}
                          </div>
                        </td>

                        {/* 4. Type */}
                        <td className="px-3.5 py-3 text-xs whitespace-nowrap">
                          <Badge variant="neutral">{o.order_type || "DINE_IN"}</Badge>
                        </td>

                        {/* 5. Payment Method */}
                        <td className="px-3.5 py-3 text-xs whitespace-nowrap">
                          <Badge
                            variant={
                              o.payment_method === "SPLIT"
                                ? "warning"
                                : o.payment_method === "UPI_QR"
                                ? "info"
                                : "success"
                            }
                          >
                            {o.payment_method === "SPLIT"
                              ? "Split (Cash + UPI)"
                              : o.payment_method === "UPI_QR"
                              ? "Google Pay / UPI"
                              : "Cash"}
                          </Badge>
                          {o.payment_method === "SPLIT" && (
                            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                              ₹{o.cash_amount} (Cash) + ₹{o.gpay_amount} (UPI)
                            </div>
                          )}
                        </td>

                        {/* 6. Total Amount */}
                        <td className="px-3.5 py-3 font-black text-xs text-amber-600 dark:text-amber-400 font-mono text-right whitespace-nowrap">
                          {formatCurrency(o.total_amount)}
                        </td>

                        {/* 7. Received Amount */}
                        <td className="px-3.5 py-3 font-bold text-xs text-emerald-600 dark:text-emerald-400 font-mono text-right whitespace-nowrap">
                          {formatCurrency(receivedAmount)}
                        </td>

                        {/* 8. Balance Amount */}
                        <td className="px-3.5 py-3 font-medium text-xs text-slate-500 font-mono text-right whitespace-nowrap">
                          {formatCurrency(balanceAmount)}
                        </td>

                        {/* 9. Bill Created At + Cashier */}
                        <td className="px-3.5 py-3 text-xs whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-slate-600 dark:text-slate-300 font-medium">
                              {formatDateTime(o.created_at)}
                            </span>
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                              <UserIcon className="w-2.5 h-2.5" />
                              {cashierDisplay}
                            </span>
                          </div>
                        </td>

                        {/* 10. Action (Rebill, Print) */}
                        <td className="px-3.5 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleRebill(o)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-800 dark:text-amber-300 hover:text-slate-950 transition-colors border border-amber-500/30"
                              title="Rebill / Load items into POS"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Rebill</span>
                            </button>

                            <button
                              onClick={() => handlePrint(o)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700"
                              title="Print Thermal Receipt"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Print</span>
                            </button>
                          </div>
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

      {/* 80mm Thermal Receipt Print Modal */}
      <ReceiptModal
        isOpen={printModalOpen}
        onClose={() => {
          setPrintModalOpen(false);
          setSelectedOrderForPrint(null);
        }}
        order={selectedOrderForPrint}
        shop={shop}
      />
    </AdminLayout>
  );
};

export default ReportsDashboard;
