import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CreateExpenseModal } from "@/components/modals/CreateExpenseModal";
import { dataService } from "@/services/supabaseService";
import { Expense } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, DollarSign } from "lucide-react";

export const ExpenseList: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    dataService.getExpenses().then(setExpenses);
  }, []);

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const columns = [
    {
      key: "title",
      header: "Expense Item",
      render: (e: Expense) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white block">{e.title}</span>
          <span className="text-xs text-slate-400">{e.notes || e.category}</span>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (e: Expense) => <Badge variant="neutral">{e.category}</Badge>,
    },
    {
      key: "expense_date",
      header: "Date",
      render: (e: Expense) => <span className="text-xs text-slate-500">{formatDate(e.expense_date)}</span>,
    },
    {
      key: "payment_method",
      header: "Payment Mode",
      render: (e: Expense) => <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{e.payment_method}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      render: (e: Expense) => (
        <span className="font-bold text-sm text-rose-600 dark:text-rose-400">-{formatCurrency(e.amount)}</span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
              Daily Operating Expenses
            </h1>
            <p className="text-xs text-slate-500">
              Track milk deliveries, LPG gas cylinders, store rent, and staff refreshments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">
              Total Logged: <span className="text-rose-600 text-sm">{formatCurrency(totalExpenseAmount)}</span>
            </span>
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setModalOpen(true)}>
              Record Expense
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={expenses}
          searchKey="title"
          searchPlaceholder="Search expenses..."
        />
      </div>

      <CreateExpenseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(newE) => setExpenses([newE, ...expenses])}
      />
    </AdminLayout>
  );
};
export default ExpenseList;
