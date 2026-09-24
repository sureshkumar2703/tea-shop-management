import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { FileUpload } from "../ui/FileUpload";
import { Expense } from "@/types";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { dataService } from "@/services/supabaseService";
import { storageService } from "@/services/storageService";
import { useAuthStore } from "@/stores/authStore";

interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newExpense: Expense) => void;
}

export const CreateExpenseModal: React.FC<CreateExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { shop } = useAuthStore();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI_QR" | "CARD">("UPI_QR");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;
    setIsLoading(true);

    const created = await dataService.createExpense({
      title,
      category,
      amount: parseFloat(amount) || 0,
      payment_method: paymentMethod,
      expense_date: expenseDate,
      receipt_url: receiptUrl,
      notes,
    });

    setIsLoading(false);
    onSuccess(created);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Store Expense"
      description="Track store operating expenditures like milk, gas cylinders, and rent"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Expense Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. 50L Fresh Cow Milk Batch"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
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
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="UPI_QR">UPI / QR Code</option>
              <option value="CASH">Cash (Drawer)</option>
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
          label="Notes / Vendor / Bill #"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Paid to Nandini Dairy morning runner"
        />

        <FileUpload
          label="Receipt / Bill Document (Tea-Shop-Images)"
          folder={storageService.getShopFolder(shop?.shop_code || shop?.slug, "expenses")}
          accept="image/*,.pdf,.doc,.docx"
          value={receiptUrl}
          onChange={setReceiptUrl}
          helperText={`Stored in folder 'shops/${shop?.shop_code || shop?.slug || "general"}/expenses' in Supabase`}
        />

        <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} className="flex-1">
            Record Expense
          </Button>
        </div>
      </form>
    </Modal>
  );
};
