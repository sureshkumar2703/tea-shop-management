import React, { useState, useEffect, useMemo } from "react";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { dataService } from "@/services/supabaseService";
import { Shop, Expense } from "@/types";
import { formatCurrency, formatDate, getLocalDateStr, isSameLocalDate } from "@/lib/utils";
import { getPdfWatermarkHtml, getPdfWatermarkCss, getPdfHeaderHtml } from "@/lib/pdfUtils";
import {
  Wallet,
  Store,
  Calendar,
  Filter,
  Download,
  Search,
  Banknote,
  QrCode,
  TrendingDown,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
} from "lucide-react";

export const ShopExpenseReport: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter periods
  const [activePeriod, setActivePeriod] = useState<
    "DAY" | "WEEK" | "MONTH" | "YEAR" | "SELECTED_MONTH" | "SELECTED_YEAR" | "OVERALL"
  >("DAY");
  const [selectedDay, setSelectedDay] = useState<string>(getLocalDateStr(new Date()));
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedMonthYear, setSelectedMonthYear] = useState<number>(new Date().getFullYear());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Search, Category & Status Filter
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

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
    dataService.getExpenses(selectedShopId).then((res) => {
      setExpenses(res || []);
      setLoading(false);
    });
  }, [selectedShopId]);

  const selectedShopObj = shops.find((s) => s.id === selectedShopId) || shops[0];

  // Unique Categories from expenses
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set);
  }, [expenses]);

  // Date Filtering Calculation
  const { filteredExpenses, periodLabel } = useMemo(() => {
    const now = new Date();
    let list: Expense[] = [];
    let label = "";

    if (activePeriod === "DAY") {
      list = expenses.filter(
        (e) =>
          isSameLocalDate(e.expense_date, selectedDay) ||
          isSameLocalDate(e.created_at, selectedDay) ||
          e.expense_date === selectedDay
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

      list = expenses.filter((e) => {
        const loc = getLocalDateStr(e.expense_date || e.created_at);
        return loc >= mondayStr && loc <= sundayStr;
      });
      label = `Current Week Report (${formatDate(mondayStr)} - ${formatDate(sundayStr)})`;
    } else if (activePeriod === "MONTH") {
      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      list = expenses.filter((e) => {
        const loc = getLocalDateStr(e.expense_date || e.created_at);
        return loc.startsWith(currentMonthStr) || e.expense_date?.startsWith(currentMonthStr);
      });
      label = `Current Month Report: ${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`;
    } else if (activePeriod === "YEAR") {
      const currentYearStr = `${now.getFullYear()}`;
      list = expenses.filter((e) => {
        const loc = getLocalDateStr(e.expense_date || e.created_at);
        return loc.startsWith(currentYearStr) || e.expense_date?.startsWith(currentYearStr);
      });
      label = `Current Year Report: ${now.getFullYear()}`;
    } else if (activePeriod === "SELECTED_MONTH") {
      const monthPrefix = `${selectedMonthYear}-${String(selectedMonth).padStart(2, "0")}`;
      list = expenses.filter((e) => {
        const loc = getLocalDateStr(e.expense_date || e.created_at);
        return loc.startsWith(monthPrefix) || e.expense_date?.startsWith(monthPrefix);
      });
      const monthName = new Date(selectedMonthYear, selectedMonth - 1).toLocaleString("default", {
        month: "long",
      });
      label = `Selected Month Report: ${monthName} ${selectedMonthYear}`;
    } else if (activePeriod === "SELECTED_YEAR") {
      const yearPrefix = `${selectedYear}`;
      list = expenses.filter((e) => {
        const loc = getLocalDateStr(e.expense_date || e.created_at);
        return loc.startsWith(yearPrefix) || e.expense_date?.startsWith(yearPrefix);
      });
      label = `Selected Year Report: Year ${selectedYear}`;
    } else if (activePeriod === "OVERALL") {
      list = expenses;
      label = "Overall Lifetime Report (All-Time)";
    }

    // Filter by Category
    if (categoryFilter !== "ALL") {
      list = list.filter((e) => e.category === categoryFilter);
    }

    // Filter by Status
    if (statusFilter !== "ALL") {
      list = list.filter((e) => (e.status || "COMPLETED") === statusFilter);
    }

    // Filter by Search Term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((e) => {
        const titleMatch = e.title?.toLowerCase().includes(q);
        const catMatch = e.category?.toLowerCase().includes(q);
        const notesMatch = e.notes?.toLowerCase().includes(q);
        const u = e.user as any;
        const userMatch =
          u?.name?.toLowerCase().includes(q) ||
          u?.full_name?.toLowerCase().includes(q) ||
          u?.email?.toLowerCase().includes(q);
        return titleMatch || catMatch || notesMatch || userMatch;
      });
    }

    return {
      filteredExpenses: list.sort(
        (a, b) =>
          new Date(b.expense_date || b.created_at || "").getTime() -
          new Date(a.expense_date || a.created_at || "").getTime()
      ),
      periodLabel: label,
    };
  }, [
    expenses,
    activePeriod,
    selectedDay,
    selectedMonth,
    selectedMonthYear,
    selectedYear,
    categoryFilter,
    statusFilter,
    searchTerm,
  ]);

  // Summary Metrics
  const totalCount = filteredExpenses.length;
  const totalExpenseAmount = filteredExpenses.reduce(
    (sum, e) =>
      sum +
      (e.status === "COMPLETED" && e.bill_amount !== undefined && e.bill_amount > 0
        ? Number(e.bill_amount)
        : Number(e.amount || 0)),
    0
  );
  const cashExpenses = filteredExpenses.reduce((sum, e) => {
    if (e.payment_method === "CASH" || !e.payment_method) {
      return (
        sum +
        (e.status === "COMPLETED" && e.bill_amount !== undefined && e.bill_amount > 0
          ? Number(e.bill_amount)
          : Number(e.amount || 0))
      );
    }
    return sum;
  }, 0);
  const onlineExpenses = filteredExpenses.reduce((sum, e) => {
    if (e.payment_method === "UPI_QR" || e.payment_method === "CARD") {
      return (
        sum +
        (e.status === "COMPLETED" && e.bill_amount !== undefined && e.bill_amount > 0
          ? Number(e.bill_amount)
          : Number(e.amount || 0))
      );
    }
    return sum;
  }, 0);

  // Helper for staff name
  const getStaffName = (u: any) => u?.full_name || u?.name || u?.email || "Store Staff";

  // Export CSV
  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        "Date,Expense Title,Category,Recorded By,Payment Mode,Amount,Bill Amount,Status,Notes",
      ].join(",") +
      "\n" +
      filteredExpenses
        .map((e) =>
          [
            `"${formatDate(e.expense_date || e.created_at)}"`,
            `"${e.title}"`,
            `"${e.category || "General"}"`,
            `"${getStaffName(e.user)}"`,
            `"${e.payment_method || "CASH"}"`,
            e.amount || 0,
            e.bill_amount || 0,
            `"${e.status || "COMPLETED"}"`,
            `"${(e.notes || "").replace(/"/g, '""')}"`,
          ].join(",")
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Shop_Expenses_${selectedShopObj?.name || "Store"}_${activePeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF with Watermark and Shop Logo
  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = filteredExpenses
      .map(
        (e, idx) => `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-family: monospace;">${idx + 1}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${formatDate(e.expense_date || e.created_at)}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600; font-size: 11px;">${e.title}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;"><span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">${e.category || "General"}</span></td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${getStaffName(e.user)}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${e.payment_method || "CASH"}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;"><span style="background: ${e.status === "COMPLETED" ? "#d1fae5" : "#fef3c7"}; color: ${e.status === "COMPLETED" ? "#065f46" : "#92400e"}; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">${e.status || "COMPLETED"}</span></td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: right; font-weight: 700; color: #dc2626;">${formatCurrency(e.status === "COMPLETED" && e.bill_amount ? e.bill_amount : e.amount)}</td>
      </tr>
    `
      )
      .join("");

    const watermarkHtml = getPdfWatermarkHtml(selectedShopObj?.name || "Store", selectedShopObj?.logo_url);
    const watermarkCss = getPdfWatermarkCss();
    const headerHtml = getPdfHeaderHtml(
      selectedShopObj?.name || "Store",
      selectedShopObj?.address || "Main Store Location",
      `Shop Expenses & Outflows Report - ${periodLabel}`,
      selectedShopObj?.logo_url
    );

    printWindow.document.write(`
      <html>
        <head>
          <title>${selectedShopObj?.name || "Store"} - Expenses Report</title>
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
              <div class="metric-title">Total Records</div>
              <div class="metric-val">${totalCount} Expenses</div>
            </div>
            <div class="metric-box">
              <div class="metric-title">Total Expenditure</div>
              <div class="metric-val" style="color: #dc2626;">${formatCurrency(totalExpenseAmount)}</div>
            </div>
            <div class="metric-box">
              <div class="metric-title">Cash Outflow</div>
              <div class="metric-val" style="color: #b45309;">${formatCurrency(cashExpenses)}</div>
            </div>
            <div class="metric-box">
              <div class="metric-title">Online Outflow</div>
              <div class="metric-val" style="color: #1d4ed8;">${formatCurrency(onlineExpenses)}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Expense Title</th>
                <th>Category</th>
                <th>Recorded By</th>
                <th>Payment Mode</th>
                <th>Status</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #94a3b8;">No expense records found for this period.</td></tr>'}
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
              <Wallet className="w-6 h-6 text-amber-500" />
              Shop Expenses & Outflows Report
            </h1>
            <p className="text-xs text-slate-500">
              Select any franchise to audit store spending, operational costs, daily milk/grocery purchases, and settlements
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
            <Badge variant="danger" size="sm" className="self-start sm:self-auto">
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
            title="Total Expenses Count"
            value={`${totalCount} Entries`}
            icon={<Wallet className="w-5 h-5 text-amber-500" />}
            color="amber"
          />
          <StatCard
            title="Total Outflow / Spend"
            value={formatCurrency(totalExpenseAmount)}
            icon={<TrendingDown className="w-5 h-5 text-red-500" />}
            color="purple"
          />
          <StatCard
            title="Cash Expenses"
            value={formatCurrency(cashExpenses)}
            icon={<Banknote className="w-5 h-5 text-amber-600" />}
            color="amber"
          />
          <StatCard
            title="Online / UPI Expenses"
            value={formatCurrency(onlineExpenses)}
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
                placeholder="Search by expense title, category, staff name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  {categoriesList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="ALL">All Status</option>
                  <option value="COMPLETED">Completed (Settled)</option>
                  <option value="PENDING">Pending (Floating Cash)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expense Title</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Recorded By</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Payment Mode</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Amount Spent</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                      No expense records found for the selected shop and date criteria.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((e) => {
                    const effectiveAmount =
                      e.status === "COMPLETED" && e.bill_amount !== undefined && e.bill_amount > 0
                        ? Number(e.bill_amount)
                        : Number(e.amount || 0);

                    return (
                      <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                          {formatDate(e.expense_date || e.created_at)}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{e.title}</td>
                        <td className="py-3 px-4">
                          <Badge variant="amber" size="sm">
                            {e.category || "General"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {getStaffName(e.user)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="neutral" size="sm">
                            {e.payment_method || "CASH"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={e.status === "COMPLETED" ? "success" : "warning"} size="sm">
                            {e.status === "COMPLETED" ? (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Settled
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            )}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(effectiveAmount)}
                          {e.status === "COMPLETED" && e.bill_amount && e.amount !== e.bill_amount ? (
                            <span className="block text-[10px] text-slate-400 font-normal">
                              Adv: {formatCurrency(e.amount)}
                            </span>
                          ) : null}
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{e.notes || "-"}</td>
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

export default ShopExpenseReport;
