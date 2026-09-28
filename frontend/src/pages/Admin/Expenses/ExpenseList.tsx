import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CreateExpenseModal } from "@/components/modals/CreateExpenseModal";
import { dataService } from "@/services/supabaseService";
import { useAuthStore } from "@/stores/authStore";
import { Expense } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getPdfWatermarkCss, getPdfWatermarkHtml, getPdfHeaderHtml } from "@/lib/pdfUtils";
import { Plus, CheckCircle2, Clock, Check, Edit3, Trash2, User as UserIcon, FileSpreadsheet, FileText } from "lucide-react";

export const ExpenseList: React.FC = () => {
  const { shop, user } = useAuthStore();
  const currentShopId = shop?.id || user?.shop_id;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [modalMode, setModalMode] = useState<"CREATE" | "SETTLE" | "EDIT">("CREATE");

  const loadExpenses = () => {
    dataService.getExpenses(currentShopId).then(setExpenses);
  };

  useEffect(() => {
    loadExpenses();
  }, [currentShopId]);

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

  const handleOpenEdit = (exp: Expense) => {
    setSelectedExpense(exp);
    setModalMode("EDIT");
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this expense record?")) {
      await dataService.deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const totalGivenAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalBillAmount = expenses.reduce((sum, e) => sum + (e.bill_amount || 0), 0);
  const totalBalanceAmount = expenses.reduce(
    (sum, e) => sum + (e.balance_amount !== undefined ? e.balance_amount : e.amount - (e.bill_amount || 0)),
    0
  );
  const pendingCount = expenses.filter((e) => e.status === "PENDING").length;

  // Export to Excel (.csv)
  const handleExportExcel = () => {
    if (expenses.length === 0) {
      alert("No expense records to export.");
      return;
    }

    const headers = [
      "Expense Title",
      "Category",
      "Notes",
      "Staff / User",
      "Date",
      "Cash Given Amount (INR)",
      "Actual Bill Spent (INR)",
      "Balance Returned / Pending (INR)",
      "Status",
    ];

    const rows = expenses.map((e) => {
      const userName =
        e.user && typeof e.user === "object"
          ? (e.user as any).name || (e.user as any).full_name || (e.user as any).email
          : "Staff";
      const bal = e.balance_amount !== undefined ? e.balance_amount : e.amount - (e.bill_amount || 0);

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

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const shopSlug = (shop?.name || "Store").replace(/[^a-zA-Z0-9_-]/g, "_");
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `Expenses_List_${shopSlug}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (expenses.length === 0) {
      alert("No expense records to export.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const shopName = shop?.name || "Tea Shop";
    const shopAddress = shop?.address || "";

    const rowsHtml = expenses
      .map((e) => {
        const userName =
          e.user && typeof e.user === "object"
            ? (e.user as any).name || (e.user as any).full_name || (e.user as any).email
            : "Staff";
        const bal = e.balance_amount !== undefined ? e.balance_amount : e.amount - (e.bill_amount || 0);

        return `
        <tr>
          <td><strong>${e.title}</strong><br><small style="color: #64748b;">${e.category} ${e.notes ? `• ${e.notes}` : ''}</small></td>
          <td>${userName}</td>
          <td>${formatDate(e.expense_date || e.created_at)}</td>
          <td style="text-align: right; font-weight: 600;">₹${Number(e.amount || 0).toFixed(2)}</td>
          <td style="text-align: right; color: #dc2626; font-weight: 600;">₹${Number(e.bill_amount || 0).toFixed(2)}</td>
          <td style="text-align: right; color: #16a34a; font-weight: 600;">₹${Number(bal).toFixed(2)}</td>
          <td><span class="badge ${e.status === 'PENDING' ? 'pending' : 'settled'}">${e.status === 'PENDING' ? 'PENDING' : 'SETTLED'}</span></td>
        </tr>
      `;
      })
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Expenses & Petty Cash - ${shopName}</title>
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
          .badge.settled { background: #dcfce7; color: #166534; }
          .badge.pending { background: #fef3c7; color: #92400e; }
          .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          ${getPdfWatermarkCss()}
          @media print { body { padding: 0; } @page { size: landscape; margin: 12mm; } }
        </style>
      </head>
      <body>
        ${getPdfWatermarkHtml(shopName, shop?.logo_url)}
        ${getPdfHeaderHtml(shopName, shopAddress, "STORE EXPENSES & PETTY CASH AUDIT", shop?.logo_url)}

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-label">Total Cash Issued</div>
            <div class="stat-val">₹${totalGivenAmount.toLocaleString()}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label" style="color: #dc2626;">Actual Bill Spent</div>
            <div class="stat-val" style="color: #dc2626;">₹${totalBillAmount.toLocaleString()}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label" style="color: #16a34a;">Balance Returned / Pending</div>
            <div class="stat-val" style="color: #16a34a;">₹${totalBalanceAmount.toLocaleString()}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Expense Details</th>
              <th>Staff / User</th>
              <th>Date</th>
              <th style="text-align: right;">Given Amount</th>
              <th style="text-align: right;">Bill Amount</th>
              <th style="text-align: right;">Balance / Return</th>
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

  const columns = [
    {
      key: "title",
      header: "Expense Details",
      render: (e: Expense) => (
        <div className="max-w-xs">
          <span className="font-bold text-slate-900 dark:text-white block truncate">{e.title}</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] font-medium text-slate-400">{e.category}</span>
            {e.notes && <span className="text-[11px] text-slate-500 truncate max-w-[160px]">• {e.notes}</span>}
          </div>
        </div>
      ),
    },
    {
      key: "user",
      header: "Staff / User",
      render: (e: Expense) => {
        const userName =
          e.user && typeof e.user === "object"
            ? (e.user as any).name || (e.user as any).full_name || (e.user as any).email
            : "Staff";
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
            <UserIcon className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-medium">{userName}</span>
          </div>
        );
      },
    },
    {
      key: "expense_date",
      header: "Date",
      render: (e: Expense) => (
        <span className="text-xs text-slate-500 font-medium">{formatDate(e.expense_date)}</span>
      ),
    },
    {
      key: "amount",
      header: "Given Amount",
      render: (e: Expense) => (
        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
          {formatCurrency(e.amount)}
        </span>
      ),
    },
    {
      key: "bill_amount",
      header: "Bill Amount",
      render: (e: Expense) => (
        <span className={`font-bold text-xs ${e.bill_amount ? "text-rose-600 dark:text-rose-400" : "text-slate-400"}`}>
          {e.bill_amount ? `-${formatCurrency(e.bill_amount)}` : "—"}
        </span>
      ),
    },
    {
      key: "balance_amount",
      header: "Balance / Return",
      render: (e: Expense) => {
        const bal = e.balance_amount !== undefined ? e.balance_amount : (e.amount - (e.bill_amount || 0));
        return (
          <span
            className={`font-black text-xs px-2 py-0.5 rounded-md ${
              bal >= 0
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            }`}
          >
            {bal >= 0 ? formatCurrency(bal) : `-${formatCurrency(Math.abs(bal))}`}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (e: Expense) => (
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
            e.status === "COMPLETED"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse"
          }`}
        >
          {e.status === "COMPLETED" ? (
            <>
              <CheckCircle2 className="w-3 h-3" /> Settled
            </>
          ) : (
            <>
              <Clock className="w-3 h-3" /> Pending
            </>
          )}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      render: (e: Expense) => (
        <div className="flex items-center gap-1.5">
          {e.status === "PENDING" ? (
            <button
              onClick={() => handleOpenSettle(e)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors shadow-sm"
              title="Settle bill & calculate balance"
            >
              <Check className="w-3 h-3" /> Settle Bill
            </button>
          ) : (
            <button
              onClick={() => handleOpenEdit(e)}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Edit expense details"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => handleDelete(e.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Delete record"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header and Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
              Store Expenses & Petty Cash Handover
            </h1>
            <p className="text-xs text-slate-500">
              Stage 1: Issue cash to staff (Pending) • Stage 2: Submit bill & return remaining balance (Settled)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin/reports/user-expenses">
              <Button
                variant="outline"
                size="sm"
                icon={<UserIcon className="w-4 h-4 text-amber-500" />}
                className="text-xs font-semibold"
              >
                User-wise Expense Report
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              onClick={handleExportExcel}
              disabled={expenses.length === 0}
            >
              Download Excel (.csv)
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
              onClick={handleExportPDF}
              disabled={expenses.length === 0}
            >
              Download PDF
            </Button>
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleOpenCreate}>
              Issue Cash / Record Expense
            </Button>
          </div>
        </div>

        {/* 3 Quick KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Total Cash Issued
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
                {formatCurrency(totalGivenAmount)}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">
              {expenses.length} txns
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Actual Bill Spent
              </span>
              <span className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
                {formatCurrency(totalBillAmount)}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Balance Returned / Pending
              </span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                {formatCurrency(totalBalanceAmount)}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs">
              {pendingCount} pend
            </div>
          </div>
        </div>

        {/* Expenses Data Table */}
        <DataTable
          columns={columns}
          data={expenses}
          searchKey="title"
          searchPlaceholder="Search expense items, categories, or notes..."
        />
      </div>

      <CreateExpenseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        expenseToEdit={selectedExpense}
        initialMode={modalMode}
        onSuccess={() => {
          loadExpenses();
          setModalOpen(false);
        }}
      />
    </AdminLayout>
  );
};

export default ExpenseList;

