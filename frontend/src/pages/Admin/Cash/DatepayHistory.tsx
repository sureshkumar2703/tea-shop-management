import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { dataService } from "@/services/supabaseService";
import { useAuthStore } from "@/stores/authStore";
import { Datepay } from "@/types";
import { formatCurrency, formatDate, getLocalDateStr } from "@/lib/utils";
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Banknote,
  QrCode,
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  Clock,
  CheckCircle2,
  Lock,
  Unlock,
  Plus,
  ArrowRight,
  Layers,
  Coins,
  ChevronRight,
} from "lucide-react";

type PeriodPreset = "THIS_MONTH" | "LAST_MONTH" | "THIS_YEAR" | "ALL_TIME" | "CUSTOM";

export const DatepayHistory: React.FC = () => {
  const navigate = useNavigate();
  const { shop, user } = useAuthStore();
  const currentShopId = shop?.id || user?.shop_id || "a1111111-1111-1111-1111-111111111111";

  const [datepays, setDatepays] = useState<Datepay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter states
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodPreset>("THIS_MONTH");
  const now = new Date();
  const [startDate, setStartDate] = useState<string>(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
  );
  const [endDate, setEndDate] = useState<string>(getLocalDateStr(now));
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await dataService.getDatepays(currentShopId);
      setDatepays(data || []);
    } catch (err) {
      console.error("Failed to load datepay history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentShopId]);

  // Handle Preset Change
  const handlePeriodChange = (period: PeriodPreset) => {
    setSelectedPeriod(period);
    const curr = new Date();

    if (period === "THIS_MONTH") {
      setStartDate(`${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, "0")}-01`);
      setEndDate(getLocalDateStr(curr));
    } else if (period === "LAST_MONTH") {
      const prevMonthDate = new Date(curr.getFullYear(), curr.getMonth() - 1, 1);
      const lastDayPrevMonth = new Date(curr.getFullYear(), curr.getMonth(), 0);
      setStartDate(getLocalDateStr(prevMonthDate));
      setEndDate(getLocalDateStr(lastDayPrevMonth));
    } else if (period === "THIS_YEAR") {
      setStartDate(`${curr.getFullYear()}-01-01`);
      setEndDate(getLocalDateStr(curr));
    }
  };

  // Filtered Datepays
  const filteredDatepays = useMemo(() => {
    let list = [...datepays];

    // 1. Date filter
    if (selectedPeriod === "THIS_MONTH" || selectedPeriod === "LAST_MONTH" || selectedPeriod === "THIS_YEAR" || selectedPeriod === "CUSTOM") {
      if (startDate) {
        list = list.filter((d) => d.date >= startDate);
      }
      if (endDate) {
        list = list.filter((d) => d.date <= endDate);
      }
    }

    // 2. Status filter
    if (statusFilter !== "ALL") {
      list = list.filter((d) => d.status === statusFilter);
    }

    // 3. Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((d) => {
        const dateMatch = d.date.includes(q);
        const notesMatch = d.notes?.toLowerCase().includes(q);
        const statusMatch = d.status.toLowerCase().includes(q);
        return dateMatch || notesMatch || statusMatch;
      });
    }

    // Sort newest date first
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [datepays, selectedPeriod, startDate, endDate, statusFilter, searchTerm]);

  // Aggregated KPI Metrics
  const metrics = useMemo(() => {
    let totalInvestment = 0;
    let totalBillingCash = 0;
    let totalBillingGpay = 0;
    let totalBilling = 0;
    let totalExpenses = 0;
    let totalNetBalance = 0;
    let totalClosingCash = 0;
    let closedDaysCount = 0;

    filteredDatepays.forEach((d) => {
      totalInvestment += Number(d.investment_amount) || 0;
      totalBillingCash += Number(d.total_billing_cash) || 0;
      totalBillingGpay += Number(d.total_billing_gpay) || 0;
      totalBilling += Number(d.total_billing) || 0;
      totalExpenses += Number(d.total_expenses) || 0;
      totalNetBalance += Number(d.calculated_balance) || 0;

      if (d.actual_closing_cash !== undefined && d.actual_closing_cash !== null) {
        totalClosingCash += Number(d.actual_closing_cash);
        closedDaysCount++;
      }
    });

    return {
      totalDays: filteredDatepays.length,
      totalInvestment,
      totalBillingCash,
      totalBillingGpay,
      totalBilling,
      totalExpenses,
      totalNetBalance,
      totalClosingCash,
      closedDaysCount,
    };
  }, [filteredDatepays]);

  // Export to Excel (.csv)
  const handleExportExcel = () => {
    if (filteredDatepays.length === 0) {
      alert("No datepay settlement records found to export.");
      return;
    }

    const headers = [
      "Settlement Date",
      "Morning Float / Investment (INR)",
      "Cash Billing (INR)",
      "UPI / GPay Billing (INR)",
      "Total Gross Billing (INR)",
      "Total Expenses Deducted (INR)",
      "Calculated Net Day Balance (INR)",
      "Actual Closing Cash (INR)",
      "Status",
      "Reconciliation Notes",
    ];

    const rows = filteredDatepays.map((d) => [
      `"${d.date}"`,
      d.investment_amount || 0,
      d.total_billing_cash || 0,
      d.total_billing_gpay || 0,
      d.total_billing || 0,
      d.total_expenses || 0,
      d.calculated_balance || 0,
      d.actual_closing_cash !== null && d.actual_closing_cash !== undefined ? d.actual_closing_cash : "-",
      `"${d.status || 'OPEN'}"`,
      `"${(d.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const shopSlug = (shop?.name || "Store").replace(/[^a-zA-Z0-9_-]/g, "_");
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `Datepay_History_${shopSlug}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (filteredDatepays.length === 0) {
      alert("No datepay settlement records found to export.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const shopName = shop?.name || "Tea Shop";
    const shopAddress = shop?.address || "";
    const periodLabel =
      selectedPeriod === "CUSTOM"
        ? `${startDate} to ${endDate}`
        : selectedPeriod.replace(/_/g, " ");

    const rowsHtml = filteredDatepays
      .map(
        (d) => `
        <tr>
          <td><strong>${formatDate(d.date)}</strong></td>
          <td style="text-align: right; font-weight: 600;">₹${Number(d.investment_amount || 0).toLocaleString()}</td>
          <td style="text-align: right; color: #16a34a;">₹${Number(d.total_billing_cash || 0).toLocaleString()}</td>
          <td style="text-align: right; color: #9333ea;">₹${Number(d.total_billing_gpay || 0).toLocaleString()}</td>
          <td style="text-align: right; font-weight: 700;">₹${Number(d.total_billing || 0).toLocaleString()}</td>
          <td style="text-align: right; color: #dc2626;">-₹${Number(d.total_expenses || 0).toLocaleString()}</td>
          <td style="text-align: right; font-weight: 800; color: #2563eb;">₹${Number(d.calculated_balance || 0).toLocaleString()}</td>
          <td style="text-align: right; font-weight: 700;">${d.actual_closing_cash !== null && d.actual_closing_cash !== undefined ? `₹${Number(d.actual_closing_cash).toLocaleString()}` : '-'}</td>
          <td><span class="badge ${d.status === 'CLOSED' ? 'closed' : 'open'}">${d.status}</span></td>
          <td style="font-size: 11px; max-width: 150px;">${d.notes || '-'}</td>
        </tr>
      `
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daily Cash & Datepay History - ${shopName}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 18px; }
          .shop-title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; }
          .shop-meta { font-size: 12px; color: #64748b; margin-top: 4px; }
          .report-badge { background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 13px; display: inline-block; }
          .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 20px; }
          .stat-box { background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; }
          .stat-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; }
          .stat-val { font-size: 17px; font-weight: 800; color: #0f172a; margin-top: 3px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
          th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 7px 8px; text-align: left; font-size: 10px; text-transform: uppercase; color: #475569; }
          td { border: 1px solid #e2e8f0; padding: 7px 8px; }
          tr:nth-child(even) { background: #f8fafc; }
          .badge { padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; }
          .badge.closed { background: #fee2e2; color: #991b1b; }
          .badge.open { background: #dcfce7; color: #166534; }
          .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          @media print { body { padding: 0; } @page { size: landscape; margin: 10mm; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="shop-title">${shopName}</h1>
            <div class="shop-meta">${shopAddress}</div>
          </div>
          <div style="text-align: right;">
            <div class="report-badge">DAILY CASH & DATEPAY SETTLEMENT HISTORY</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Period: ${periodLabel} | Generated: ${new Date().toLocaleString()}</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-label">Total Days</div>
            <div class="stat-val">${metrics.totalDays} Days</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Opening Float</div>
            <div class="stat-val">₹${metrics.totalInvestment.toLocaleString()}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label" style="color: #16a34a;">Total Gross Sales</div>
            <div class="stat-val" style="color: #16a34a;">₹${metrics.totalBilling.toLocaleString()}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label" style="color: #dc2626;">Total Expenses</div>
            <div class="stat-val" style="color: #dc2626;">-₹${metrics.totalExpenses.toLocaleString()}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label" style="color: #2563eb;">Net Balance</div>
            <div class="stat-val" style="color: #2563eb;">₹${metrics.totalNetBalance.toLocaleString()}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th style="text-align: right;">Owner Float</th>
              <th style="text-align: right;">Cash Sales</th>
              <th style="text-align: right;">UPI Sales</th>
              <th style="text-align: right;">Total Billing</th>
              <th style="text-align: right;">Expenses</th>
              <th style="text-align: right;">Net Balance</th>
              <th style="text-align: right;">Closing Cash</th>
              <th>Status</th>
              <th>Remarks</th>
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

  const periodPresets: { id: PeriodPreset; label: string }[] = [
    { id: "THIS_MONTH", label: "This Month" },
    { id: "LAST_MONTH", label: "Last Month" },
    { id: "THIS_YEAR", label: "This Year" },
    { id: "ALL_TIME", label: "All Time" },
    { id: "CUSTOM", label: "Custom Date Range" },
  ];

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-6 h-6 text-amber-500" />
              Daily Cash & Datepay Settlement History
            </h1>
            <p className="text-xs text-slate-500">
              Complete historical ledger of daily owner investments, cash/UPI collections, expenses, and closing drawer reconciliations
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              onClick={handleExportExcel}
              disabled={filteredDatepays.length === 0}
            >
              Download Excel (.csv)
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
              onClick={handleExportPDF}
              disabled={filteredDatepays.length === 0}
            >
              Download PDF
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => navigate("/admin/datepay")}
            >
              Daily Cash Calculator
            </Button>
          </div>
        </div>

        {/* 5 KPI Metric Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <StatCard
            title="Recorded Days"
            value={`${metrics.totalDays} Days`}
            icon={<Calendar className="w-5 h-5 text-blue-500" />}
            subtitle={`${metrics.closedDaysCount} Closed`}
            color="blue"
          />
          <StatCard
            title="Total Float / Opening"
            value={formatCurrency(metrics.totalInvestment)}
            icon={<Coins className="w-5 h-5 text-amber-500" />}
            subtitle="Owner Investment"
            color="amber"
          />
          <StatCard
            title="Total Gross Billing"
            value={formatCurrency(metrics.totalBilling)}
            icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
            subtitle={`Cash: ${formatCurrency(metrics.totalBillingCash)}`}
            color="emerald"
          />
          <StatCard
            title="Total Expenses"
            value={`-${formatCurrency(metrics.totalExpenses)}`}
            icon={<DollarSign className="w-5 h-5 text-rose-500" />}
            subtitle="Daily deductions"
            color="amber"
          />
          <StatCard
            title="Total Net Balance"
            value={formatCurrency(metrics.totalNetBalance)}
            icon={<Banknote className="w-5 h-5 text-indigo-500" />}
            subtitle="Float + Sales - Exp"
            color="purple"
          />
        </div>

        {/* Filter Controls Bar */}
        <Card className="p-4 space-y-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 dark:border-slate-800">
            {periodPresets.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePeriodChange(p.id)}
                className={`px-3.5 py-1.5 text-xs font-bold whitespace-nowrap rounded-xl transition-all ${
                  selectedPeriod === p.id
                    ? "bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center pt-1">
            {/* Search */}
            <div className="md:col-span-5 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by date (YYYY-MM-DD), notes, remarks..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            {/* Status Filter */}
            <div className="md:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">All Status ({datepays.length})</option>
                <option value="CLOSED">CLOSED Only</option>
                <option value="OPEN">OPEN Only</option>
                <option value="SETTLED">SETTLED Only</option>
              </select>
            </div>

            {/* Custom Date Pickers */}
            {selectedPeriod === "CUSTOM" && (
              <div className="md:col-span-4 flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-white"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-white"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Historical Logs Ledger Table */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              Historical Datepay Entries ({filteredDatepays.length})
            </h2>
            <span className="text-xs text-slate-400">Click any row to open in calculator</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 whitespace-nowrap">
                <tr>
                  <th className="px-3.5 py-3">Date</th>
                  <th className="px-3.5 py-3 text-right">Morning Float</th>
                  <th className="px-3.5 py-3 text-right">Cash Billing</th>
                  <th className="px-3.5 py-3 text-right">UPI / GPay</th>
                  <th className="px-3.5 py-3 text-right">Total Billing</th>
                  <th className="px-3.5 py-3 text-right">Expenses</th>
                  <th className="px-3.5 py-3 text-right">Net Balance</th>
                  <th className="px-3.5 py-3 text-right">Closing Cash</th>
                  <th className="px-3.5 py-3 text-center">Status</th>
                  <th className="px-3.5 py-3">Remarks / Notes</th>
                  <th className="px-3.5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-xs text-slate-400">
                      Loading datepay settlement history...
                    </td>
                  </tr>
                ) : filteredDatepays.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-xs text-slate-400">
                      No datepay settlement records found for this period.
                    </td>
                  </tr>
                ) : (
                  filteredDatepays.map((dp) => {
                    const isClosed = dp.status === "CLOSED";

                    return (
                      <tr
                        key={dp.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors text-xs"
                      >
                        {/* 1. Date */}
                        <td className="px-3.5 py-3 whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-amber-500" />
                            <span>{formatDate(dp.date)}</span>
                          </div>
                        </td>

                        {/* 2. Morning Float */}
                        <td className="px-3.5 py-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                          {formatCurrency(dp.investment_amount)}
                        </td>

                        {/* 3. Cash Billing */}
                        <td className="px-3.5 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {formatCurrency(dp.total_billing_cash || 0)}
                        </td>

                        {/* 4. UPI Billing */}
                        <td className="px-3.5 py-3 text-right font-mono text-purple-600 dark:text-purple-400 whitespace-nowrap">
                          {formatCurrency(dp.total_billing_gpay || 0)}
                        </td>

                        {/* 5. Total Billing */}
                        <td className="px-3.5 py-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                          +{formatCurrency(dp.total_billing)}
                        </td>

                        {/* 6. Expenses */}
                        <td className="px-3.5 py-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          -{formatCurrency(dp.total_expenses)}
                        </td>

                        {/* 7. Net Balance */}
                        <td className="px-3.5 py-3 text-right font-mono font-black text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          {formatCurrency(dp.calculated_balance)}
                        </td>

                        {/* 8. Closing Cash */}
                        <td className="px-3.5 py-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {dp.actual_closing_cash !== null && dp.actual_closing_cash !== undefined ? (
                            formatCurrency(dp.actual_closing_cash)
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* 9. Status */}
                        <td className="px-3.5 py-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isClosed
                                ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                            }`}
                          >
                            {isClosed ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            <span>{dp.status}</span>
                          </span>
                        </td>

                        {/* 10. Remarks */}
                        <td className="px-3.5 py-3 max-w-xs truncate text-slate-500 dark:text-slate-400">
                          {dp.notes || "No notes"}
                        </td>

                        {/* 11. Action */}
                        <td className="px-3.5 py-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => navigate(`/admin/datepay`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-slate-950 transition-colors border border-amber-500/20"
                            title="Open in Datepay calculator"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
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
    </AdminLayout>
  );
};

export default DatepayHistory;
