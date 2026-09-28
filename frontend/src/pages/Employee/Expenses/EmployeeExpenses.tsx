import React, { useState, useEffect, useMemo } from "react";
import { EmployeeLayout } from "@/layouts/EmployeeLayout";
import { DataTable } from "@/components/tables/DataTable";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CreateExpenseModal } from "@/components/modals/CreateExpenseModal";
import { dataService } from "@/services/supabaseService";
import { useAuthStore } from "@/stores/authStore";
import { Expense } from "@/types";
import { formatCurrency, formatDate, getLocalDateStr } from "@/lib/utils";
import { getPdfWatermarkCss, getPdfWatermarkHtml, getPdfHeaderHtml } from "@/lib/pdfUtils";
import {
  Plus,
  DollarSign,
  Clock,
  CheckCircle2,
  User as UserIcon,
  FileSpreadsheet,
  FileText,
  Search,
  Calendar,
} from "lucide-react";

export const EmployeeExpenses: React.FC = () => {
  const { shop, user } = useAuthStore();
  const currentShopId = shop?.id || user?.shop_id;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [modalMode, setModalMode] = useState<"CREATE" | "SETTLE" | "EDIT">("CREATE");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = await dataService.getExpenses(currentShopId);
      // Filter strictly to current logged-in employee's expenses
      const myExpenses = data.filter((e) => {
        if (!user) return true;
        const eUserId =
          e.user_id ||
          e.created_by ||
          (typeof e.user === "object" ? (e.user as any)?.id : null);
        const eEmail = typeof e.user === "object" ? (e.user as any)?.email : null;
        const eName =
          typeof e.user === "object"
            ? (e.user as any)?.name || (e.user as any)?.full_name
            : null;

        return (
          eUserId === user.id ||
          (eEmail && user.email && eEmail.toLowerCase() === user.email.toLowerCase()) ||
          (eName && user.full_name && eName.toLowerCase() === user.full_name.toLowerCase()) ||
          (e.title && user.full_name && e.title.toLowerCase().includes(user.full_name.toLowerCase())) ||
          (e.title && user.email && e.title.toLowerCase().includes(user.email.toLowerCase()))
        );
      });
      setExpenses(myExpenses);
    } catch (err) {
      console.error("Failed to load employee expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [currentShopId, user]);

  const handleOpenCreate = () => {
    setSelectedExpense(null);
    setModalMode("CREATE");
    setModalOpen(true);
  };

  const handleOpenSettle = (exp: Expense) => {
    setSelectedExpense(exp);
    setModalMode("SETTLE");
    setModalOpen(true);
  };

  // Filtered expense list
  const filteredExpenses = useMemo(() => {
    let list = [...expenses];

    if (statusFilter === "PENDING") {
      list = list.filter((e) => e.status === "PENDING");
    } else if (statusFilter === "COMPLETED") {
      list = list.filter((e) => e.status !== "PENDING");
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((e) => {
        const titleMatch = e.title?.toLowerCase().includes(q);
        const notesMatch = e.notes?.toLowerCase().includes(q);
        const categoryMatch = e.category?.toLowerCase().includes(q);
        const userName =
          e.user && typeof e.user === "object"
            ? (e.user as any).name || (e.user as any).full_name || (e.user as any).email
            : "";
        const userMatch = userName.toLowerCase().includes(q);
        return titleMatch || notesMatch || categoryMatch || userMatch;
      });
    }

    return list;
  }, [expenses, statusFilter, searchTerm]);

  // Aggregate statistics
  const totalGivenAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalBillAmount = expenses.reduce((sum, e) => sum + (e.bill_amount || 0), 0);
  const totalBalanceAmount = expenses.reduce(
    (sum, e) => sum + (e.balance_amount !== undefined ? e.balance_amount : e.amount - (e.bill_amount || 0)),
    0
  );
  const pendingCount = expenses.filter((e) => e.status === "PENDING").length;

  const columns = [
    {
      key: "title",
      header: "Expense Info",
      render: (e: Expense) => {
        const userName =
          e.user && typeof e.user === "object"
            ? (e.user as any).name || (e.user as any).full_name || (e.user as any).email
            : user?.full_name || "Staff";
        return (
          <div className="space-y-0.5">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
              <span>{e.title || "Daily Store Expense"}</span>
              <Badge variant="neutral" size="sm" className="text-[10px] py-0 px-1.5">
                {e.category || "General"}
              </Badge>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <UserIcon className="w-3 h-3 text-slate-400" />
                {userName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {formatDate(e.expense_date || e.created_at)}
              </span>
            </div>
            {e.notes && (
              <p className="text-[11px] text-slate-500 italic max-w-xs truncate">{e.notes}</p>
            )}
          </div>
        );
      },
    },
    {
      key: "amount",
      header: "Given Amount",
      render: (e: Expense) => (
        <span className="font-bold text-slate-900 dark:text-white font-mono text-xs sm:text-sm">
          {formatCurrency(e.amount)}
        </span>
      ),
    },
    {
      key: "bill_amount",
      header: "Bill Spent",
      render: (e: Expense) => (
        <span className="font-bold text-amber-600 dark:text-amber-400 font-mono text-xs sm:text-sm">
          {e.bill_amount !== undefined && e.bill_amount !== null
            ? formatCurrency(e.bill_amount)
            : "—"}
        </span>
      ),
    },
    {
      key: "balance_amount",
      header: "Balance",
      render: (e: Expense) => {
        const bal =
          e.balance_amount !== undefined && e.balance_amount !== null
            ? e.balance_amount
            : e.amount - (e.bill_amount || 0);

        return (
          <span
            className={`font-black font-mono text-xs sm:text-sm ${
              bal < 0
                ? "text-rose-600 dark:text-rose-400"
                : bal > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-500"
            }`}
          >
            {formatCurrency(bal)}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (e: Expense) => (
        <Badge variant={e.status === "PENDING" ? "warning" : "success"}>
          {e.status === "PENDING" ? (
            <span className="flex items-center gap-1 text-[11px]">
              <Clock className="w-3 h-3" /> PENDING
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="w-3 h-3" /> SETTLED
            </span>
          )}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (e: Expense) => (
        <div className="flex items-center gap-1.5">
          {e.status === "PENDING" ? (
            <Button
              variant="primary"
              size="sm"
              className="text-xs py-1 px-2.5 h-auto bg-amber-500 hover:bg-amber-600 font-bold"
              onClick={() => handleOpenSettle(e)}
            >
              Settle Bill
            </Button>
          ) : (
            <span className="text-xs font-semibold text-slate-400">
              —
            </span>
          )}
        </div>
      ),
    },
  ];

  // Export to Excel (.csv)
  const handleExportExcel = () => {
    if (filteredExpenses.length === 0) {
      alert("No expense records to export.");
      return;
    }

    const headers = [
      "Expense Title",
      "Category",
      "Notes",
      "Staff / User",
      "Date",
      "Cash Given (INR)",
      "Actual Bill Spent (INR)",
      "Balance (INR)",
      "Status",
    ];

    const rows = filteredExpenses.map((e) => {
      const userName =
        e.user && typeof e.user === "object"
          ? (e.user as any).name || (e.user as any).full_name || (e.user as any).email
          : "Staff";
      const bal =
        e.balance_amount !== undefined ? e.balance_amount : e.amount - (e.bill_amount || 0);

      return [
        `"${e.title || ''}"`,
        `"${e.category || 'General'}"`,
        `"${(e.notes || '').replace(/"/g, '""')}"`,
        `"${userName}"`,
        `"${formatDate(e.expense_date || e.created_at)}"`,
        e.amount || 0,
        e.bill_amount || 0,
        bal,
        `"${e.status === 'PENDING' ? 'PENDING' : 'SETTLED'}"`,
      ];
    });

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const shopSlug = (shop?.name || "Store").replace(/[^a-zA-Z0-9_-]/g, "_");
    const dateStr = getLocalDateStr(new Date());
    link.setAttribute("href", url);
    link.setAttribute("download", `Expenses_${shopSlug}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (filteredExpenses.length === 0) {
      alert("No expense records to export.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const shopName = shop?.name || "Tea Shop";
    const shopAddress = shop?.address || "";

    const rowsHtml = filteredExpenses
      .map((e) => {
        const userName =
          e.user && typeof e.user === "object"
            ? (e.user as any).name || (e.user as any).full_name || (e.user as any).email
            : "Staff";
        const bal =
          e.balance_amount !== undefined ? e.balance_amount : e.amount - (e.bill_amount || 0);

        return `
          <tr>
            <td><strong>${e.title || 'Daily Expense'}</strong><br><small style="color: #64748b;">${e.category || 'General'} · By ${userName}</small></td>
            <td>₹${e.amount || 0}</td>
            <td>₹${e.bill_amount !== undefined ? e.bill_amount : '—'}</td>
            <td style="font-weight: bold; color: ${bal < 0 ? '#dc2626' : bal > 0 ? '#16a34a' : '#475569'};">₹${bal}</td>
            <td>${formatDate(e.expense_date || e.created_at)}</td>
            <td><span class="badge ${e.status === 'PENDING' ? 'pending' : 'settled'}">${e.status === 'PENDING' ? 'PENDING' : 'SETTLED'}</span></td>
          </tr>
        `;
      })
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daily Store Expenses - ${shopName}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1e293b; position: relative; }
          .shop-title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
          .shop-meta { font-size: 11px; color: #64748b; margin-top: 2px; }
          .report-badge { background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 12px; display: inline-block; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .stat-box { background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; }
          .stat-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
          .stat-val { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
          th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; }
          td { border: 1px solid #e2e8f0; padding: 8px 10px; }
          tr:nth-child(even) { background: #f8fafc; }
          .badge { padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
          .badge.pending { background: #fef3c7; color: #92400e; }
          .badge.settled { background: #dcfce7; color: #166534; }
          .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          ${getPdfWatermarkCss()}
          @media print { body { padding: 0; } @page { size: landscape; margin: 12mm; } }
        </style>
      </head>
      <body>
        ${getPdfWatermarkHtml(shopName, shop?.logo_url)}
        ${getPdfHeaderHtml(shopName, shopAddress, "DAILY EXPENSES REPORT", shop?.logo_url)}

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-label">Total Given Cash</div>
            <div class="stat-val">₹${totalGivenAmount.toFixed(2)}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Actual Bill Spent</div>
            <div class="stat-val" style="color: #d97706;">₹${totalBillAmount.toFixed(2)}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Net Balance</div>
            <div class="stat-val" style="color: #16a34a;">₹${totalBalanceAmount.toFixed(2)}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Pending Settlements</div>
            <div class="stat-val" style="color: #ea580c;">${pendingCount}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Expense / Staff</th>
              <th>Given Cash</th>
              <th>Bill Spent</th>
              <th>Balance</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">Report generated from ${shopName} POS & Staff Management.</div>
        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <EmployeeLayout>
      <div className="space-y-5">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-amber-500" />
              Daily Expenses & Petty Cash
            </h1>
            <p className="text-xs text-slate-500">
              Record shift petty expenses, milk/sugar purchases, and settle bills
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              onClick={handleExportExcel}
              disabled={filteredExpenses.length === 0}
            >
              Excel (.csv)
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<FileText className="w-4 h-4 text-rose-600" />}
              onClick={handleExportPDF}
              disabled={filteredExpenses.length === 0}
            >
              PDF
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleOpenCreate}
            >
              Add Expense
            </Button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Given Cash
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {formatCurrency(totalGivenAmount)}
            </p>
          </Card>

          <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
              Actual Bill Spent
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {formatCurrency(totalBillAmount)}
            </p>
          </Card>

          <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
              Net Balance
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(totalBalanceAmount)}
            </p>
          </Card>

          <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
              Pending Settlements
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
              {pendingCount}
            </p>
          </Card>
        </div>

        {/* Search & Filters */}
        <Card className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search expenses by note, title, staff..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="ALL">All Status ({expenses.length})</option>
              <option value="PENDING">Pending Only ({pendingCount})</option>
              <option value="COMPLETED">Settled Only ({expenses.length - pendingCount})</option>
            </select>
          </div>
        </Card>

        {/* Expenses DataTable */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Shift Expenses Log ({filteredExpenses.length})
            </h2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading daily expenses...</div>
          ) : filteredExpenses.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <DollarSign className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
              <p>No expense records found matching your filters.</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredExpenses}
              pageSize={10}
              emptyTitle="No expenses found"
              emptyDescription="No expense records match the selected filters."
            />
          )}
        </Card>

        {/* Create / Settle / Edit Modal */}
        <CreateExpenseModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={(saved) => {
            loadExpenses();
            setModalOpen(false);
          }}
          expenseToEdit={selectedExpense}
          initialMode={modalMode}
        />
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeExpenses;
