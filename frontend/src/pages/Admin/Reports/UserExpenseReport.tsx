import React, { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CreateExpenseModal } from "@/components/modals/CreateExpenseModal";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { dataService } from "@/services/supabaseService";
import { useAuthStore } from "@/stores/authStore";
import { Expense, Profile } from "@/types";
import { formatCurrency, formatDate, getLocalDateStr, isSameLocalDate } from "@/lib/utils";
import {
  DollarSign,
  Users,
  Search,
  Calendar,
  TrendingUp,
  Banknote,
  FileSpreadsheet,
  FileText,
  Clock,
  CheckCircle2,
  Filter,
  Layers,
  Edit3,
  Check,
  RotateCcw,
} from "lucide-react";

type FilterPeriod =
  | "TODAY"
  | "YESTERDAY"
  | "THIS_WEEK"
  | "THIS_MONTH"
  | "THIS_YEAR"
  | "ALL_TIME"
  | "CUSTOM";

export const UserExpenseReport: React.FC = () => {
  const { shop, user } = useAuthStore();
  const currentShopId = shop?.id || user?.shop_id || "a1111111-1111-1111-1111-111111111111";

  // Data states
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal states for Settle / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [modalMode, setModalMode] = useState<"CREATE" | "SETTLE" | "EDIT">("CREATE");

  // Filter states
  const [selectedUserId, setSelectedUserId] = useState<string>("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>("THIS_MONTH");
  const [startDate, setStartDate] = useState<string>(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`
  );
  const [endDate, setEndDate] = useState<string>(getLocalDateStr(new Date()));
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const [expensesData, employeesData] = await Promise.all([
        dataService.getExpenses(currentShopId),
        dataService.getEmployees(currentShopId),
      ]);
      setExpenses(expensesData || []);
      let allProfiles = employeesData || [];
      if (user && !allProfiles.some((p) => p.id === user.id)) {
        allProfiles = [
          ...allProfiles,
          {
            id: user.id,
            shop_id: currentShopId,
            full_name: user.full_name || (user as any).name || "Shop Owner",
            email: user.email,
            phone: user.phone,
            role: user.role || "OWNER",
            is_active: true,
            created_at: new Date().toISOString(),
          } as Profile,
        ];
      }
      setProfiles(allProfiles);
    } catch (err) {
      console.error("Error fetching user expense data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentShopId]);

  // Extract all unique users who have expenses or are registered
  const userList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email?: string; phone?: string; role?: string }>();

    // Add registered profiles
    profiles.forEach((p) => {
      map.set(p.id, {
        id: p.id,
        name: p.full_name || "Unknown Staff",
        email: p.email,
        phone: p.phone,
        role: p.role || "EMPLOYEE",
      });
    });

    // Also scan expenses for users
    expenses.forEach((e) => {
      const uId = e.user_id || e.created_by;
      if (uId && !map.has(uId)) {
        const uName =
          e.user && typeof e.user === "object"
            ? (e.user as any).name || (e.user as any).full_name || (e.user as any).email
            : "Staff";
        map.set(uId, {
          id: uId,
          name: uName,
          role: "STAFF",
        });
      }
    });

    return Array.from(map.values());
  }, [profiles, expenses]);

  // Selected User Object
  const selectedUserObj = useMemo(() => {
    if (selectedUserId === "ALL") return null;
    return userList.find((u) => u.id === selectedUserId) || null;
  }, [selectedUserId, userList]);

  // Filter expenses by User, Date, Status, Search
  const filteredExpenses = useMemo(() => {
    let list = [...expenses];

    // 1. User Filter
    if (selectedUserId !== "ALL") {
      list = list.filter((e) => {
        const uId = e.user_id || e.created_by;
        if (uId === selectedUserId) return true;
        if (selectedUserObj && e.user && typeof e.user === "object") {
          const uName = (e.user as any).name || (e.user as any).full_name || (e.user as any).email;
          if (uName && uName.toLowerCase().trim() === selectedUserObj.name.toLowerCase().trim()) return true;
        }
        return false;
      });
    }

    // 2. Date Filter
    const now = new Date();
    const todayStr = getLocalDateStr(now);

    if (selectedPeriod === "TODAY") {
      list = list.filter((e) => isSameLocalDate(e.expense_date || e.created_at, todayStr));
    } else if (selectedPeriod === "YESTERDAY") {
      const y = new Date(Date.now() - 86400000);
      const yStr = getLocalDateStr(y);
      list = list.filter((e) => isSameLocalDate(e.expense_date || e.created_at, yStr));
    } else if (selectedPeriod === "THIS_WEEK") {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      list = list.filter((e) => new Date(e.expense_date || e.created_at) >= monday);
    } else if (selectedPeriod === "THIS_MONTH") {
      const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      list = list.filter((e) => {
        const loc = getLocalDateStr(e.expense_date || e.created_at);
        return loc.startsWith(monthPrefix);
      });
    } else if (selectedPeriod === "THIS_YEAR") {
      const yearPrefix = `${now.getFullYear()}`;
      list = list.filter((e) => {
        const loc = getLocalDateStr(e.expense_date || e.created_at);
        return loc.startsWith(yearPrefix);
      });
    } else if (selectedPeriod === "CUSTOM") {
      if (startDate) {
        list = list.filter((e) => getLocalDateStr(e.expense_date || e.created_at) >= startDate);
      }
      if (endDate) {
        list = list.filter((e) => getLocalDateStr(e.expense_date || e.created_at) <= endDate);
      }
    }

    // 3. Status Filter
    if (statusFilter !== "ALL") {
      list = list.filter((e) => e.status === statusFilter);
    }

    // 4. Search Filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((e) => {
        const titleMatch = e.title?.toLowerCase().includes(q);
        const catMatch = e.category?.toLowerCase().includes(q);
        const notesMatch = e.notes?.toLowerCase().includes(q);
        const uName =
          e.user && typeof e.user === "object"
            ? (e.user as any).name || (e.user as any).full_name || (e.user as any).email
            : "";
        const userMatch = uName.toLowerCase().includes(q);
        return titleMatch || catMatch || notesMatch || userMatch;
      });
    }

    // Sort newest date first
    return list.sort(
      (a, b) =>
        new Date(b.expense_date || b.created_at).getTime() - new Date(a.expense_date || a.created_at).getTime()
    );
  }, [expenses, selectedUserId, selectedUserObj, selectedPeriod, startDate, endDate, statusFilter, searchTerm]);

  // Metrics
  const metrics = useMemo(() => {
    let totalGiven = 0;
    let totalSpent = 0;
    let totalBalance = 0;
    let pendingCount = 0;
    let settledCount = 0;

    filteredExpenses.forEach((e) => {
      const g = Number(e.amount) || 0;
      const b = Number(e.bill_amount) || 0;
      const bal = e.balance_amount !== undefined ? Number(e.balance_amount) : g - b;

      totalGiven += g;
      totalSpent += b;
      totalBalance += bal;

      if (e.status === "PENDING") {
        pendingCount++;
      } else {
        settledCount++;
      }
    });

    return {
      totalRecords: filteredExpenses.length,
      totalGiven,
      totalSpent,
      totalBalance,
      pendingCount,
      settledCount,
    };
  }, [filteredExpenses]);

  // Export to Excel (.csv)
  const handleExportExcel = () => {
    if (filteredExpenses.length === 0) {
      alert("No expense records to export for this filter.");
      return;
    }

    const headers = [
      "Expense Date",
      "Staff / User",
      "Category",
      "Title / Description",
      "Cash Given (INR)",
      "Actual Bill Spent (INR)",
      "Balance Returned / Pending (INR)",
      "Status",
    ];

    const rows = filteredExpenses.map((e) => {
      const uName =
        e.user && typeof e.user === "object"
          ? (e.user as any).name || (e.user as any).full_name || (e.user as any).email
          : "Staff";
      const bal = e.balance_amount !== undefined ? e.balance_amount : (e.amount || 0) - (e.bill_amount || 0);

      return [
        `"${formatDate(e.expense_date || e.created_at)}"`,
        `"${uName}"`,
        `"${e.category || 'General'}"`,
        `"${(e.title || e.notes || '').replace(/"/g, '""')}"`,
        e.amount || 0,
        e.bill_amount || 0,
        bal,
        `"${e.status === 'PENDING' ? 'PENDING' : 'SETTLED'}"`,
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    const dateLabel = getLocalDateStr(new Date());
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `User_Expenses_${selectedUserObj ? selectedUserObj.name.replace(/\s+/g, "_") : "All"}_${dateLabel}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (filteredExpenses.length === 0) {
      alert("No expense records to export for this filter.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const shopName = shop?.name || "Chai Craft Tea Shop";
    const userName = selectedUserObj ? `${selectedUserObj.name} (${selectedUserObj.role})` : "All Staff & Users";

    const rowsHtml = filteredExpenses
      .map((e) => {
        const uName =
          e.user && typeof e.user === "object"
            ? (e.user as any).name || (e.user as any).full_name || (e.user as any).email
            : "Staff";
        const bal = e.balance_amount !== undefined ? e.balance_amount : (e.amount || 0) - (e.bill_amount || 0);

        return `
        <tr>
          <td>${formatDate(e.expense_date || e.created_at)}</td>
          <td><strong>${uName}</strong></td>
          <td>${e.category || 'General'}</td>
          <td>${e.title || e.notes || '-'}</td>
          <td style="text-align: right; font-weight: bold;">₹${Number(e.amount || 0).toFixed(2)}</td>
          <td style="text-align: right; font-weight: bold; color: #16a34a;">₹${Number(e.bill_amount || 0).toFixed(2)}</td>
          <td style="text-align: right; font-weight: bold; color: ${bal >= 0 ? '#d97706' : '#dc2626'};">₹${Number(bal).toFixed(2)}</td>
          <td style="text-align: center;">
            <span style="display:inline-block; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:bold; background:${
              e.status === 'PENDING' ? '#fef3c7; color:#92400e;' : '#dcfce7; color:#15803d;'
            }">${e.status === 'PENDING' ? 'PENDING' : 'SETTLED'}</span>
          </td>
        </tr>
      `;
      })
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>User Expense Report - ${userName}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1e293b; line-height: 1.4; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 20px; }
          .shop-title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; }
          .report-badge { background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 13px; display: inline-block; margin-bottom: 4px; }
          .user-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
          .stat-box { background: #f1f5f9; padding: 12px; border-radius: 8px; text-align: center; border-left: 4px solid #f59e0b; }
          .stat-box.green { border-left-color: #10b981; }
          .stat-box.blue { border-left-color: #3b82f6; }
          .stat-box.red { border-left-color: #ef4444; }
          .stat-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; }
          .stat-val { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
          th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; }
          td { border: 1px solid #e2e8f0; padding: 8px 10px; }
          tr:nth-child(even) { background: #f8fafc; }
          .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          @media print { body { padding: 0; } @page { size: landscape; margin: 12mm; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="shop-title">${shopName}</h1>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Staff Expense & Petty Cash Ledger</div>
          </div>
          <div style="text-align: right;">
            <div class="report-badge">STAFF / USER EXPENSE REPORT</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Generated: ${new Date().toLocaleString()}</div>
          </div>
        </div>

        <div class="user-card">
          <div>
            <div style="font-size: 15px; font-weight: 800; color: #0f172a;">Staff Member / User: ${userName}</div>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 12px; font-weight: 700; color: #475569;">Total Expenses:</span>
            <span style="font-size: 12px; font-weight: 800; color: #0f172a; margin-left: 4px;">${metrics.totalRecords} entries</span>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-label">Total Cash Given</div>
            <div class="stat-val">₹${metrics.totalGiven.toLocaleString()}</div>
          </div>
          <div class="stat-box green">
            <div class="stat-label">Actual Bill Spent</div>
            <div class="stat-val">₹${metrics.totalSpent.toLocaleString()}</div>
          </div>
          <div class="stat-box blue">
            <div class="stat-label">Net Balance Left</div>
            <div class="stat-val">₹${metrics.totalBalance.toLocaleString()}</div>
          </div>
          <div class="stat-box red">
            <div class="stat-label">Pending Settlements</div>
            <div class="stat-val">${metrics.pendingCount}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Staff User</th>
              <th>Category</th>
              <th>Title / Purpose</th>
              <th style="text-align: right;">Given (₹)</th>
              <th style="text-align: right;">Spent (₹)</th>
              <th style="text-align: right;">Balance (₹)</th>
              <th style="text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          Report generated from ${shopName} Management System.
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const periodTabs = [
    { id: "TODAY", label: "Today" },
    { id: "YESTERDAY", label: "Yesterday" },
    { id: "THIS_WEEK", label: "This Week" },
    { id: "THIS_MONTH", label: "This Month" },
    { id: "THIS_YEAR", label: "This Year" },
    { id: "ALL_TIME", label: "All Time" },
    { id: "CUSTOM", label: "Custom Date Range" },
  ];

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-amber-500" />
              Staff & User Expense History
            </h1>
            <p className="text-xs text-slate-500">
              Select any staff member or cashier to view and export their cash advances, bill settlement history, and balance audits.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              onClick={handleExportExcel}
              disabled={filteredExpenses.length === 0}
            >
              Download Excel (.csv)
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
              onClick={handleExportPDF}
              disabled={filteredExpenses.length === 0}
            >
              Download PDF
            </Button>
          </div>
        </div>

        {/* User Selection & Controls Card */}
        <Card className="p-5 space-y-4 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent border-amber-500/20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* 1. User / Staff Selector with Searchable Select */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-500" />
                Select Staff / User:
              </label>
              <SearchableSelect
                value={
                  selectedUserId === "ALL"
                    ? "All Staff & Users"
                    : selectedUserObj
                    ? `${selectedUserObj.name} (${selectedUserObj.role})`
                    : ""
                }
                options={[
                  { value: "ALL", label: "All Staff & Users" },
                  ...userList.map((u) => ({
                    value: u.id,
                    label: `${u.name} (${u.role})`,
                  })),
                ]}
                placeholder="Type or select staff name..."
                onChange={(displayVal, selectedOption) => {
                  if (selectedOption) {
                    setSelectedUserId(selectedOption.value);
                  } else if (!displayVal.trim() || displayVal.toLowerCase() === "all" || displayVal.toLowerCase().includes("all staff")) {
                    setSelectedUserId("ALL");
                  } else {
                    const matched = userList.find(
                      (u) =>
                        u.name.toLowerCase().includes(displayVal.toLowerCase()) ||
                        `${u.name} (${u.role})`.toLowerCase().includes(displayVal.toLowerCase())
                    );
                    if (matched) {
                      setSelectedUserId(matched.id);
                    }
                  }
                }}
                onClear={() => setSelectedUserId("ALL")}
              />
            </div>

            {/* 2. Status Filter with Searchable Select */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-amber-500" />
                Settlement Status:
              </label>
              <SearchableSelect
                value={
                  statusFilter === "ALL"
                    ? "All Statuses"
                    : statusFilter === "PENDING"
                    ? "Pending Settlement Only"
                    : "Completed / Settled Only"
                }
                options={[
                  { value: "ALL", label: "All Statuses" },
                  { value: "PENDING", label: "Pending Settlement Only" },
                  { value: "COMPLETED", label: "Completed / Settled Only" },
                ]}
                placeholder="Filter status..."
                onChange={(displayVal, selectedOption) => {
                  if (selectedOption) {
                    setStatusFilter(selectedOption.value);
                  } else if (!displayVal.trim() || displayVal.toLowerCase() === "all") {
                    setStatusFilter("ALL");
                  }
                }}
                onClear={() => setStatusFilter("ALL")}
              />
            </div>

            {/* 3. Search Bar */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-amber-500" />
                Search Expense Details:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search title, purpose, category, notes..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 shadow-sm"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* Date Period Presets & Custom Range */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {periodTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedPeriod(tab.id as FilterPeriod)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedPeriod === tab.id
                        ? "bg-amber-500 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {selectedPeriod === "CUSTOM" && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-white font-medium shadow-sm"
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-white font-medium shadow-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Aggregate KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Cash Given"
            value={formatCurrency(metrics.totalGiven)}
            subtitle={`${metrics.totalRecords} expense vouchers issued`}
            icon={<Banknote className="w-5 h-5 text-amber-500" />}
          />
          <StatCard
            title="Actual Bill Spent"
            value={formatCurrency(metrics.totalSpent)}
            subtitle="Verified vendor bill amounts"
            icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
          />
          <StatCard
            title="Net Balance Amount"
            value={formatCurrency(metrics.totalBalance)}
            subtitle={metrics.totalBalance >= 0 ? "Cash remaining to return" : "Excess spent by staff"}
            icon={<DollarSign className="w-5 h-5 text-blue-500" />}
          />
          <StatCard
            title="Pending Settlements"
            value={`${metrics.pendingCount}`}
            subtitle={`${metrics.settledCount} vouchers settled`}
            icon={<Clock className="w-5 h-5 text-rose-500" />}
          />
        </div>

        {/* Expenses Table */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Expense Details</th>
                  <th className="px-4 py-3.5">Staff / User</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5 text-right">Given (₹)</th>
                  <th className="px-4 py-3.5 text-right">Bill Spent (₹)</th>
                  <th className="px-4 py-3.5 text-right">Balance (₹)</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((e) => {
                    const uName =
                      e.user && typeof e.user === "object"
                        ? (e.user as any).name || (e.user as any).full_name || (e.user as any).email
                        : "Staff";
                    const bal = e.balance_amount !== undefined ? e.balance_amount : (e.amount || 0) - (e.bill_amount || 0);

                    return (
                      <tr key={e.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {e.title || "Cash Expense"}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>{formatDate(e.expense_date || e.created_at)}</span>
                            {e.notes && <span className="truncate max-w-xs">&bull; {e.notes}</span>}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-600 font-bold flex items-center justify-center text-xs">
                              {uName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-900 dark:text-white">{uName}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <Badge variant="neutral">{e.category || "General"}</Badge>
                        </td>

                        <td className="px-4 py-3.5 text-right font-bold text-slate-900 dark:text-white">
                          {formatCurrency(e.amount || 0)}
                        </td>

                        <td className="px-4 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(e.bill_amount || 0)}
                        </td>

                        <td className="px-4 py-3.5 text-right font-bold">
                          <span className={bal >= 0 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}>
                            {formatCurrency(bal)}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          {e.status === "PENDING" ? (
                            <Badge variant="warning">PENDING</Badge>
                          ) : (
                            <Badge variant="success">SETTLED</Badge>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {e.status === "PENDING" && (
                              <Button
                                size="sm"
                                variant="primary"
                                icon={<Check className="w-3.5 h-3.5" />}
                                onClick={() => {
                                  setSelectedExpense(e);
                                  setModalMode("SETTLE");
                                  setModalOpen(true);
                                }}
                                className="text-xs py-1"
                              >
                                Settle
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              icon={<Edit3 className="w-3.5 h-3.5" />}
                              onClick={() => {
                                setSelectedExpense(e);
                                setModalMode("EDIT");
                                setModalOpen(true);
                              }}
                              className="text-xs py-1"
                            >
                              Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 text-sm">
                      No expense records found matching the selected filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal for Settle / Edit */}
      {modalOpen && (
        <CreateExpenseModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedExpense(null);
          }}
          onSuccess={() => {
            loadData();
            setModalOpen(false);
            setSelectedExpense(null);
          }}
          expenseToEdit={selectedExpense}
          initialMode={modalMode}
        />
      )}
    </AdminLayout>
  );
};

export default UserExpenseReport;
