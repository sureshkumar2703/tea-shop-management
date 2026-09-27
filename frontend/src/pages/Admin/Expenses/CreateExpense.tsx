import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { dataService } from "@/services/supabaseService";
import { useAuthStore } from "@/stores/authStore";
import { ArrowLeft, Lock, AlertTriangle } from "lucide-react";

export const CreateExpense: React.FC = () => {
  const navigate = useNavigate();
  const { shop } = useAuthStore();
  const shopId = shop?.id || "a1111111-1111-1111-1111-111111111111";

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI_QR" | "CARD">("UPI_QR");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(true);
  const [checkingRegister, setCheckingRegister] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      setCheckingRegister(true);
      const dp = await dataService.getTodayDatepay(shopId, expenseDate);
      setIsRegisterOpen(dp?.status === "OPEN");
      setCheckingRegister(false);
    };
    checkStatus();
  }, [shopId, expenseDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    if (!isRegisterOpen) {
      alert("⚠️ Register is CLOSED or Opening Float is not set for this date. Please enter opening cash in Datepay first.");
      return;
    }

    setIsLoading(true);

    await dataService.createExpense({
      shop_id: shopId,
      title,
      category,
      amount: parseFloat(amount) || 0,
      payment_method: paymentMethod,
      expense_date: expenseDate,
      notes,
    });

    setIsLoading(false);
    navigate("/admin/expenses");
  };

  return (
    <AdminLayout>
      <div className="max-w-xl mx-auto space-y-6">
        <button
          onClick={() => navigate("/admin/expenses")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Expenses
        </button>

        <div>
          <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
            Log Store Operating Expense
          </h1>
          <p className="text-xs text-slate-500">Record payments for supplies, rent, utilities, and kitchen gas</p>
        </div>

        {!checkingRegister && !isRegisterOpen && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-rose-900 dark:text-rose-200">
                  Register is CLOSED for {expenseDate}
                </h3>
                <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                  Cannot record new expenses while the day register is closed or uninitialized.
                </p>
              </div>
            </div>
            <Link
              to="/admin/datepay"
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 transition-colors shadow-sm"
            >
              Open Register &rarr;
            </Link>
          </div>
        )}

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Expense Title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 50L Fresh Cow Milk Batch"
              disabled={!isRegisterOpen}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={!isRegisterOpen}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 disabled:opacity-60"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Amount (₹) *"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="2500"
                disabled={!isRegisterOpen}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  disabled={!isRegisterOpen}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 disabled:opacity-60"
                >
                  <option value="UPI_QR">UPI / QR Code</option>
                  <option value="CASH">Cash (Register Drawer)</option>
                  <option value="CARD">Debit / Credit Card</option>
                </select>
              </div>

              <Input
                label="Date of Expense"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>

            <Input
              label="Notes & Vendor Details"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid to runner for morning supply batch"
              disabled={!isRegisterOpen}
            />

            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="secondary" onClick={() => navigate("/admin/expenses")} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                variant={!isRegisterOpen ? "secondary" : "primary"}
                isLoading={isLoading}
                disabled={!isRegisterOpen}
                className="flex-1"
              >
                {!isRegisterOpen ? "Register Closed" : "Save Expense"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
};
export default CreateExpense;
