import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { CashDrawerModal } from "@/components/modals/CashDrawerModal";
import { useRegisterStore } from "@/stores/registerStore";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Banknote, QrCode, CreditCard, Lock, Unlock, ArrowUpRight, ArrowDownLeft } from "lucide-react";

export const CashRegister: React.FC = () => {
  const { currentRegister, isOpen, refreshRegister } = useRegisterStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"OPEN" | "ADJUST" | "CLOSE">("ADJUST");

  useEffect(() => {
    refreshRegister();
  }, []);

  const openModal = (mode: "OPEN" | "ADJUST" | "CLOSE") => {
    setModalMode(mode);
    setModalOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
                Cash Drawer & Shift Register
              </h1>
              <Badge variant={isOpen ? "success" : "danger"}>
                {isOpen ? "SHIFT ACTIVE" : "DRAWER CLOSED"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Opened at: {formatDateTime(currentRegister.opened_at)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isOpen ? (
              <Button variant="primary" icon={<Unlock className="w-4 h-4" />} onClick={() => openModal("OPEN")}>
                Open Shift Register
              </Button>
            ) : (
              <>
                <Button variant="outline" icon={<ArrowUpRight className="w-4 h-4" />} onClick={() => openModal("ADJUST")}>
                  Cash In / Out
                </Button>
                <Button variant="danger" icon={<Lock className="w-4 h-4" />} onClick={() => openModal("CLOSE")}>
                  Close Shift
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Financial Split Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Expected Physical Cash"
            value={formatCurrency(currentRegister.expected_cash || 0)}
            icon={<Banknote className="w-5 h-5" />}
            subtitle={`Includes ${formatCurrency(currentRegister.opening_float)} float`}
            color="amber"
          />
          <StatCard
            title="Today's Cash Sales"
            value={formatCurrency(currentRegister.cash_sales || 0)}
            icon={<Banknote className="w-5 h-5" />}
            subtitle="Counter physical notes"
            color="emerald"
          />
          <StatCard
            title="UPI / QR Collections"
            value={formatCurrency(currentRegister.upi_sales || 0)}
            icon={<QrCode className="w-5 h-5" />}
            subtitle="Direct to bank account"
            color="blue"
          />
          <StatCard
            title="Card Swipe Sales"
            value={formatCurrency(currentRegister.card_sales || 0)}
            icon={<CreditCard className="w-5 h-5" />}
            subtitle="POS swipe terminal"
            color="purple"
          />
        </div>

        {/* Drawer Reconciliation Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Current Drawer Balance Sheet
            </h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Starting Float (Opening Cash):</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(currentRegister.opening_float)}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">+ Cash Received from Orders:</span>
                <span className="font-semibold text-emerald-600">
                  +{formatCurrency(currentRegister.cash_sales)}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">+ Additional Cash In (Change float):</span>
                <span className="font-semibold text-emerald-600">
                  +{formatCurrency(currentRegister.cash_in)}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">- Cash Out (Safe Drops / Petty Cash):</span>
                <span className="font-semibold text-rose-600">
                  -{formatCurrency(currentRegister.cash_out)}
                </span>
              </div>
              <div className="py-3 flex justify-between font-black text-base text-slate-900 dark:text-white">
                <span>Calculated Till Total:</span>
                <span className="text-amber-600 font-['Outfit']">
                  {formatCurrency(currentRegister.expected_cash)}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Shift Audit Notes & Discrepancies
            </h2>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <p className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 leading-relaxed font-mono">
                {currentRegister.notes || "No cash drops or variance recorded for active shift."}
              </p>

              {currentRegister.difference !== undefined && currentRegister.difference !== 0 && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-bold">
                  Variance on last closure: {formatCurrency(currentRegister.difference)}
                </div>
              )}

              <div className="pt-2 text-[11px] text-slate-400">
                <p>&bull; Cashier must perform physical note count before closing till.</p>
                <p>&bull; Excessive cash over ₹5,000 should be transferred to safe using Cash Out.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <CashDrawerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
      />
    </AdminLayout>
  );
};
export default CashRegister;
