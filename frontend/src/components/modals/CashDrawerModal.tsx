import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { useRegisterStore } from "@/stores/registerStore";
import { formatCurrency } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, Lock, CheckCircle2 } from "lucide-react";

interface CashDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "OPEN" | "ADJUST" | "CLOSE";
}

export const CashDrawerModal: React.FC<CashDrawerModalProps> = ({
  isOpen,
  onClose,
  mode = "ADJUST",
}) => {
  const { currentRegister, isOpen: isDrawerOpen, openDrawer, recordCashMovement, closeDrawer } = useRegisterStore();

  const [floatAmount, setFloatAmount] = useState("1000");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementType, setMovementType] = useState<"IN" | "OUT">("OUT");
  const [movementReason, setMovementReason] = useState("");
  const [actualClosingCash, setActualClosingCash] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleOpen = async () => {
    const val = parseFloat(floatAmount) || 0;
    await openDrawer(val);
    setSuccessMsg("Cash drawer opened successfully!");
    setTimeout(() => {
      setSuccessMsg("");
      onClose();
    }, 1200);
  };

  const handleAdjustment = () => {
    const val = parseFloat(movementAmount);
    if (!val || isNaN(val)) return;
    recordCashMovement(val, movementType, movementReason);
    setSuccessMsg(`Cash ${movementType === "IN" ? "Added" : "Dropped"} successfully!`);
    setTimeout(() => {
      setSuccessMsg("");
      setMovementAmount("");
      setMovementReason("");
      onClose();
    }, 1200);
  };

  const handleClose = async () => {
    const val = parseFloat(actualClosingCash);
    if (isNaN(val)) return;
    await closeDrawer(val, closingNotes);
    setSuccessMsg("Shift drawer closed and balanced!");
    setTimeout(() => {
      setSuccessMsg("");
      onClose();
    }, 1200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        !isDrawerOpen
          ? "Open Cash Drawer"
          : mode === "CLOSE"
          ? "Close Register Shift"
          : "Cash Drawer Adjustments"
      }
      size="sm"
    >
      {successMsg ? (
        <div className="py-8 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
          <p className="font-semibold text-slate-800 dark:text-slate-200">{successMsg}</p>
        </div>
      ) : !isDrawerOpen ? (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Enter the starting petty cash float in the register drawer for today's shift.
          </p>
          <Input
            label="Opening Float Amount (₹)"
            type="number"
            value={floatAmount}
            onChange={(e) => setFloatAmount(e.target.value)}
            placeholder="1000"
          />
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleOpen} className="flex-1">
              Open Register
            </Button>
          </div>
        </div>
      ) : mode === "CLOSE" ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Opening Float:</span>
              <span className="font-semibold">{formatCurrency(currentRegister.opening_float)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cash Sales:</span>
              <span className="font-semibold text-emerald-600">+{formatCurrency(currentRegister.cash_sales)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cash In:</span>
              <span className="font-semibold text-emerald-600">+{formatCurrency(currentRegister.cash_in)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cash Out (Drops):</span>
              <span className="font-semibold text-rose-600">-{formatCurrency(currentRegister.cash_out)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 font-bold text-sm text-slate-900 dark:text-white">
              <span>Expected Cash:</span>
              <span>{formatCurrency(currentRegister.expected_cash)}</span>
            </div>
          </div>

          <Input
            label="Actual Physical Cash Counted (₹)"
            type="number"
            value={actualClosingCash}
            onChange={(e) => setActualClosingCash(e.target.value)}
            placeholder="Count all notes and coins"
          />

          <Input
            label="Closing Notes / Discrepancy Reason"
            value={closingNotes}
            onChange={(e) => setClosingNotes(e.target.value)}
            placeholder="e.g. Exact match, or ₹10 coin shortage"
          />

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleClose} icon={<Lock className="w-4 h-4" />} className="flex-1">
              Close Shift
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMovementType("OUT")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                movementType === "OUT"
                  ? "bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                  : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400"
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Cash Out (Drop)
            </button>
            <button
              type="button"
              onClick={() => setMovementType("IN")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                movementType === "IN"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400"
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              Cash In (Float)
            </button>
          </div>

          <Input
            label="Amount (₹)"
            type="number"
            value={movementAmount}
            onChange={(e) => setMovementAmount(e.target.value)}
            placeholder="500"
          />

          <Input
            label="Reason / Notes"
            value={movementReason}
            onChange={(e) => setMovementReason(e.target.value)}
            placeholder="e.g. Deposited excess cash to bank safe, or milk vendor cash payout"
          />

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAdjustment} className="flex-1">
              Record Movement
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
