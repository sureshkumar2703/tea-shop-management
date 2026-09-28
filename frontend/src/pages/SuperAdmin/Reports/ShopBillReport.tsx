import React, { useState, useEffect, useMemo } from "react";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { ReceiptModal } from "@/components/modals/ReceiptModal";
import { dataService } from "@/services/supabaseService";
import { Shop, Order } from "@/types";
import { formatCurrency, formatDate, getLocalDateStr, isSameLocalDate } from "@/lib/utils";
import { getPdfWatermarkHtml, getPdfWatermarkCss, getPdfHeaderHtml } from "@/lib/pdfUtils";
import {
  Receipt,
  Store,
  Calendar,
  Filter,
  Download,
  Search,
  Banknote,
  QrCode,
  CreditCard,
  Printer,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";

export const ShopBillReport: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter periods
  const [activePeriod, setActivePeriod] = useState<
    "DAY" | "WEEK" | "MONTH" | "YEAR" | "SELECTED_MONTH" | "SELECTED_YEAR" | "OVERALL"
  >("DAY");
  const [selectedDay, setSelectedDay] = useState<string>(getLocalDateStr(new Date()));
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedMonthYear, setSelectedMonthYear] = useState<number>(new Date().getFullYear());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Search & Payment Filter
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("ALL");

  // Receipt Modal
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState<boolean>(false);

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
    dataService.getOrders(selectedShopId).then((res) => {
      setOrders(res || []);
      setLoading(false);
    });
  }, [selectedShopId]);

  const selectedShopObj = shops.find((s) => s.id === selectedShopId) || shops[0];

  // Date Filtering Calculation
  const { filteredOrders, periodLabel } = useMemo(() => {
    const now = new Date();
    let list: Order[] = [];
    let label = "";

    if (activePeriod === "DAY") {
      list = orders.filter(
        (o) => (isSameLocalDate(o.created_at, selectedDay) || o.created_at?.startsWith(selectedDay)) && (o.status === "COMPLETED" || !o.status)
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

      list = orders.filter((o) => {
        const loc = getLocalDateStr(o.created_at);
        return loc >= mondayStr && loc <= sundayStr && (o.status === "COMPLETED" || !o.status);
      });
      label = `Current Week Report (${formatDate(mondayStr)} - ${formatDate(sundayStr)})`;
    } else if (activePeriod === "MONTH") {
      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      list = orders.filter((o) => {
        const loc = getLocalDateStr(o.created_at);
        return (loc.startsWith(currentMonthStr) || o.created_at?.startsWith(currentMonthStr)) && (o.status === "COMPLETED" || !o.status);
      });
      label = `Current Month Report: ${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`;
    } else if (activePeriod === "YEAR") {
      const currentYearStr = `${now.getFullYear()}`;
      list = orders.filter((o) => {
        const loc = getLocalDateStr(o.created_at);
        return (loc.startsWith(currentYearStr) || o.created_at?.startsWith(currentYearStr)) && (o.status === "COMPLETED" || !o.status);
      });
      label = `Current Year Report: ${now.getFullYear()}`;
    } else if (activePeriod === "SELECTED_MONTH") {
      const monthPrefix = `${selectedMonthYear}-${String(selectedMonth).padStart(2, "0")}`;
      list = orders.filter((o) => {
        const loc = getLocalDateStr(o.created_at);
        return (loc.startsWith(monthPrefix) || o.created_at?.startsWith(monthPrefix)) && (o.status === "COMPLETED" || !o.status);
      });
      const monthName = new Date(selectedMonthYear, selectedMonth - 1).toLocaleString("default", {
        month: "long",
      });
      label = `Selected Month Report: ${monthName} ${selectedMonthYear}`;
    } else if (activePeriod === "SELECTED_YEAR") {
      const yearPrefix = `${selectedYear}`;
      list = orders.filter((o) => {
        const loc = getLocalDateStr(o.created_at);
        return (loc.startsWith(yearPrefix) || o.created_at?.startsWith(yearPrefix)) && (o.status === "COMPLETED" || !o.status);
      });
      label = `Selected Year Report: Year ${selectedYear}`;
    } else if (activePeriod === "OVERALL") {
      list = orders.filter((o) => o.status === "COMPLETED" || !o.status);
      label = "Overall Lifetime Report (All-Time)";
    }

    // Filter by Payment Method
    if (paymentMethodFilter !== "ALL") {
      list = list.filter((o) => o.payment_method === paymentMethodFilter);
    }

    // Filter by Search Term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((o) => {
        const numMatch = o.order_number?.toLowerCase().includes(q);
        const custMatch = o.customer_name?.toLowerCase().includes(q);
        const phoneMatch = o.customer_phone?.includes(q);
        const cashierMatch = o.cashier_name?.toLowerCase().includes(q);
        const itemMatch = o.items?.some((i) => i.product_name?.toLowerCase().includes(q));
        return numMatch || custMatch || phoneMatch || cashierMatch || itemMatch;
      });
    }

    return {
      filteredOrders: list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      periodLabel: label,
    };
  }, [
    orders,
    activePeriod,
    selectedDay,
    selectedMonth,
    selectedMonthYear,
    selectedYear,
    paymentMethodFilter,
    searchTerm,
  ]);

  // Summary Metrics
  const totalBills = filteredOrders.length;
  const totalBilling = filteredOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
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
  const avgBill = totalBills > 0 ? totalBilling / totalBills : 0;

  // Export CSV
  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        "Bill #,Date & Time,Cashier,Customer,Items Count,Payment Mode,Cash Amount,GPay Amount,Total Amount",
      ].join(",") +
      "\n" +
      filteredOrders
        .map((o) =>
          [
            `"${o.order_number}"`,
            `"${formatDate(o.created_at)} ${new Date(o.created_at).toLocaleTimeString()}"`,
            `"${o.cashier_name || o.cashier?.full_name || "Staff"}"`,
            `"${o.customer_name || "Walk-in"}"`,
            o.items?.length || 0,
            `"${o.payment_method}"`,
            o.payment_method === "CASH" ? o.total_amount : o.cash_amount || 0,
            o.payment_method === "UPI_QR" ? o.total_amount : o.gpay_amount || 0,
            o.total_amount,
          ].join(",")
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Shop_Bills_${selectedShopObj?.name || "Store"}_${activePeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF with Watermark and Shop Logo
  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = filteredOrders
      .map(
        (o, idx) => `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-family: monospace;">${idx + 1}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600; font-size: 11px;">${o.order_number}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${formatDate(o.created_at)} ${new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${o.cashier_name || o.cashier?.full_name || "Staff"}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${o.customer_name || "Walk-in"} ${o.customer_phone ? `(${o.customer_phone})` : ""}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;"><span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">${o.payment_method}</span></td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: right; font-weight: 700; color: #047857;">${formatCurrency(o.total_amount)}</td>
      </tr>
    `
      )
      .join("");

    const watermarkHtml = getPdfWatermarkHtml(selectedShopObj?.name || "Store", selectedShopObj?.logo_url);
    const watermarkCss = getPdfWatermarkCss();
    const headerHtml = getPdfHeaderHtml(
      selectedShopObj?.name || "Store",
      selectedShopObj?.address || "Main Store Location",
      `Shop Billing & Sales Report - ${periodLabel}`,
      selectedShopObj?.logo_url
    );

    printWindow.document.write(`
      <html>
        <head>
          <title>${selectedShopObj?.name || "Store"} - Bill Report</title>
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
              <div class="metric-title">Total Orders</div>
              <div class="metric-val">${totalBills} Bills</div>
            </div>
            <div class="metric-box">
              <div class="metric-title">Total Sales</div>
              <div class="metric-val" style="color: #047857;">${formatCurrency(totalBilling)}</div>
            </div>
            <div class="metric-box">
              <div class="metric-title">Cash Collections</div>
              <div class="metric-val" style="color: #b45309;">${formatCurrency(cashBilling)}</div>
            </div>
            <div class="metric-box">
              <div class="metric-title">UPI / GPay Sales</div>
              <div class="metric-val" style="color: #1d4ed8;">${formatCurrency(gpayBilling)}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Bill Number</th>
                <th>Date & Time</th>
                <th>Cashier / Staff</th>
                <th>Customer</th>
                <th>Payment Mode</th>
                <th style="text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #94a3b8;">No bill records found for this period.</td></tr>'}
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
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-6 h-6 text-amber-500" />
              Shop Bill & Counter Sales Report
            </h1>
            <p className="text-xs text-slate-500">
              Select any franchise to audit counter orders, revenue breakdown, and cashier collections
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
                <img src={selectedShopObj.logo_url} alt={selectedShopObj.name} className="w-10 h-10 rounded-xl object-cover border border-amber-500/30" />
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
            <Badge variant="success" size="sm" className="self-start sm:self-auto">
              {periodLabel}
            </Badge>
          </div>
        )}

        {/* Period Filter Tabs */}
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "DAY", label: "Current Day" },
              { id: "WEEK", label: "Current Week" },
              { id: "MONTH", label: "Current Month" },
              { id: "YEAR", label: "Current Year" },
              { id: "SELECTED_MONTH", label: "Selected Month" },
              { id: "SELECTED_YEAR", label: "Selected Year" },
              { id: "OVERALL", label: "Overall (All-Time)" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePeriod(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activePeriod === tab.id
                    ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dynamic Pickers for Day, Selected Month, Selected Year */}
          {activePeriod === "DAY" && (
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Select Date:</span>
              <input
                type="date"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          )}

          {activePeriod === "SELECTED_MONTH" && (
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1, 1).toLocaleString("default", { month: "long" })}
                  </option>
                ))}
              </select>

              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Year:</span>
              <select
                value={selectedMonthYear}
                onChange={(e) => setSelectedMonthYear(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 3 + i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activePeriod === "SELECTED_YEAR" && (
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Select Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 3 + i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Bills Punched"
            value={`${totalBills} Orders`}
            icon={<Receipt className="w-5 h-5 text-amber-500" />}
            color="amber"
          />
          <StatCard
            title="Total Counter Sales"
            value={formatCurrency(totalBilling)}
            icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
            color="emerald"
          />
          <StatCard
            title="Cash Collections"
            value={formatCurrency(cashBilling)}
            icon={<Banknote className="w-5 h-5 text-amber-600" />}
            color="amber"
          />
          <StatCard
            title="UPI / GPay Sales"
            value={formatCurrency(gpayBilling)}
            icon={<QrCode className="w-5 h-5 text-blue-500" />}
            color="blue"
          />
        </div>

        {/* Filters and Search Bar */}
        <Card className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search by Bill #, customer name, phone, cashier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Payment:</span>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Payment Methods</option>
                <option value="CASH">Cash Only</option>
                <option value="UPI_QR">UPI / QR Code</option>
                <option value="CARD">Debit / Credit Card</option>
                <option value="SPLIT">Split Payment</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Bill #</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cashier / Staff</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Items</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Payment Mode</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                      No bill records found for the selected shop and date criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">{o.order_number}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {formatDate(o.created_at)}
                        <span className="block text-[10px] text-slate-400">
                          {new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {o.cashier_name || o.cashier?.full_name || "Counter Staff"}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {o.customer_name || "Walk-in Guest"}
                        {o.customer_phone && <span className="block text-[10px] text-slate-400">{o.customer_phone}</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {o.items?.length || 0} items
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            o.payment_method === "CASH"
                              ? "amber"
                              : o.payment_method === "UPI_QR"
                              ? "info"
                              : "neutral"
                          }
                          size="sm"
                        >
                          {o.payment_method}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(o.total_amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setSelectedOrderForPrint(o);
                            setPrintModalOpen(true);
                          }}
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-500 hover:text-amber-500" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Print Receipt Modal */}
        {selectedOrderForPrint && (
          <ReceiptModal
            isOpen={printModalOpen}
            onClose={() => setPrintModalOpen(false)}
            order={selectedOrderForPrint}
            shop={selectedShopObj}
          />
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default ShopBillReport;
