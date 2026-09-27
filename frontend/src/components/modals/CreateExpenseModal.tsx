import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Expense, Datepay } from "@/types";
import { dataService } from "@/services/supabaseService";
import { useAuthStore } from "@/stores/authStore";
import { formatCurrency, getLocalDateStr } from "@/lib/utils";
import { User, Calculator, AlertTriangle, Lock } from "lucide-react";

interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedExpense: Expense) => void;
  expenseToEdit?: Expense | null;
  initialMode?: "CREATE" | "SETTLE" | "EDIT";
}

export const CreateExpenseModal: React.FC<CreateExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  expenseToEdit,
  initialMode = "CREATE",
}) => {
  const { user, shop } = useAuthStore();
  const isSettleMode = initialMode === "SETTLE" || (expenseToEdit && expenseToEdit.status === "PENDING");

  const todayDate = getLocalDateStr(new Date());
  const [amount, setAmount] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayDate);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [todayDatepay, setTodayDatepay] = useState<Datepay | null>(null);
  const [isCheckingDatepay, setIsCheckingDatepay] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const localToday = getLocalDateStr(new Date());
      if (expenseToEdit) {
        setAmount(expenseToEdit.amount?.toString() || "");
        setBillAmount(expenseToEdit.bill_amount ? expenseToEdit.bill_amount.toString() : "");
        setExpenseDate(expenseToEdit.expense_date || localToday);
        setNotes(expenseToEdit.notes || "");
      } else {
        setAmount("");
        setBillAmount("");
        setExpenseDate(localToday);
        setNotes("");
      }

      // Check if daycash / datepay opening cash is entered for today
      const checkDatepay = async () => {
        setIsCheckingDatepay(true);
        const shopId = shop?.id || user?.shop_id || "a1111111-1111-1111-1111-111111111111";
        const targetDate = expenseToEdit?.expense_date || localToday;
        const dp = await dataService.getTodayDatepay(shopId, targetDate);
        setTodayDatepay(dp);
        setIsCheckingDatepay(false);
      };
      checkDatepay();
    }
  }, [expenseToEdit, isOpen, shop?.id, user?.shop_id]);

  // Dynamic balance calculations
  const parsedAmount = parseFloat(amount) || 0;
  const parsedBillAmount = parseFloat(billAmount) || 0;
  const balanceAmount = parsedAmount - parsedBillAmount;

  const currentUserName =
    expenseToEdit?.user && typeof expenseToEdit.user === "object"
      ? (expenseToEdit.user as any).name || (expenseToEdit.user as any).full_name || (expenseToEdit.user as any).email
      : user?.full_name || (user as any)?.name || user?.email || "Admin User";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    setIsLoading(true);

    try {
      if (isSettleMode && expenseToEdit && expenseToEdit.id) {
        // Stage 2: Settle Expense -> updates same row, sets COMPLETED in backend
        const updated = await dataService.updateExpense(expenseToEdit.id, {
          bill_amount: parsedBillAmount,
          balance_amount: balanceAmount,
          notes: notes.trim() || undefined,
          status: "COMPLETED",
          updated_at: new Date().toISOString(),
        });
        setIsLoading(false);
        onSuccess(updated);
        onClose();
      } else {
        // Stage 1: Create Expense -> sets PENDING in backend automatically
        const created = await dataService.createExpense({
          shop_id: shop?.id,
          user_id: user?.id,
          created_by: user?.id,
          title: `Cash Expense - ${currentUserName}`,
          category: "General Expense",
          amount: parsedAmount,
          bill_amount: 0,
          balance_amount: parsedAmount,
          payment_method: "CASH",
          expense_date: expenseDate,
          notes: notes.trim() || "",
          status: "PENDING", // Automatically updated in backend
        });
        setIsLoading(false);
        onSuccess(created);
        onClose();
      }
    } catch (err) {
      console.error("Expense save error:", err);
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSettleMode ? "Settle Expense & Submit Bill" : "Issue Cash / Record Expense"}
      description={
        isSettleMode
          ? "Enter actual bill amount spent. Remaining balance is dynamically calculated."
          : "Issue cash to staff. Status is automatically set to Pending."
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            User Name
          </label>
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold">
            <User className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{currentUserName}</span>
          </div>
        </div>

        {/* Date Field (Disabled / Readonly with Default Current Date) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Expense Date
          </label>
          <input
            type="date"
            value={expenseDate}
            disabled
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 px-3.5 py-2 text-sm text-slate-600 dark:text-slate-400 cursor-not-allowed font-medium"
          />
        </div>

        {/* Amount Fields */}
        {!isSettleMode ? (
          /* Stage 1: Create Mode -> Amount Field */
          <div>
            <Input
              label="Enter Amount (₹) *"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500"
              required
              autoFocus
            />
          </div>
        ) : (
          /* Stage 2: Settle Mode -> Given Amount & Bill Amount */
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Given Amount (₹)
                </label>
                <div className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white">
                  {formatCurrency(parsedAmount)}
                </div>
              </div>

              <div>
                <Input
                  label="Enter Bill Amount (₹) *"
                  type="number"
                  step="0.01"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  placeholder="e.g. 350"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Live Dynamic Balance Calculation */}
            {(parsedAmount > 0 || parsedBillAmount > 0) && (
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  balanceAmount >= 0
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-current" />
                  <div>
                    <span className="text-xs font-bold block">
                      {balanceAmount >= 0 ? "Balance to Return:" : "Excess Spent (Reimburse):"}
                    </span>
                    <span className="text-[11px] opacity-80">
                      Given: {formatCurrency(parsedAmount)} - Bill: {formatCurrency(parsedBillAmount)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black tracking-tight">
                    {balanceAmount >= 0 ? formatCurrency(balanceAmount) : `-${formatCurrency(Math.abs(balanceAmount))}`}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes Textarea Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Notes / Description
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Milk delivery, tea leaves purchase, vendor details, bill #..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
          />
        </div>

        {/* Datepay Float Warning Banner */}
        {!isSettleMode && !isCheckingDatepay && (!todayDatepay || todayDatepay.status === "CLOSED") && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Today's Daily Cash (Datepay) Not Recorded!</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Please enter the morning opening cash float in <strong>Owner Daily Cash Entry (Datepay)</strong> first to enable recording new expenses.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={
              !isSettleMode &&
              (!todayDatepay || todayDatepay.status === "CLOSED" || !amount || parseFloat(amount) <= 0)
            }
            className="flex-1"
          >
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
};


