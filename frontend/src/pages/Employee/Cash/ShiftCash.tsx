import React, { useState } from "react";
import { EmployeeLayout } from "@/layouts/EmployeeLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { CashDrawerModal } from "@/components/modals/CashDrawerModal";
import { useRegisterStore } from "@/stores/registerStore";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Banknote, QrCode, CreditCard, ArrowUpRight, ArrowDownLeft, Lock } from "lucide-react";

export const ShiftCash: React.FC = () => {
  const { currentRegister, isOpen } = useRegisterStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"OPEN" | "ADJUST" | "CLOSE">("ADJUST");

  const openModal = (mode: "OPEN" | "ADJUST" | "CLOSE") => {
    setModalMode(mode);
    setModalOpen(true);
  };

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
                Shift Cash Drawer
              </h1>
              <Badge variant={isOpen ? "success" : "danger"}>
                {isOpen ? "SHIFT ACTIVE" : "DRAWER CLOSED"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Started shift: {formatDateTime(currentRegister.opened_at)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" icon={<ArrowUpRight className="w-4 h-4" />} onClick={() => openModal("ADJUST")}>
              Cash Drop / In
            </Button>
            <Button variant="danger" icon={<Lock className="w-4 h-4" />} onClick={() => openModal("CLOSE")}>
              Close My Shift
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard
            title="Physical Cash in Drawer"
            value={formatCurrency(currentRegister.expected_cash || 0)}
            icon={<Banknote className="w-5 h-5" />}
            subtitle={`Includes ${formatCurrency(currentRegister.opening_float)} float`}
            color="amber"
          />
          <StatCard
            title="Cash Sales"
            value={formatCurrency(currentRegister.cash_sales || 0)}
            icon={<Banknote className="w-5 h-5" />}
            color="emerald"
          />
          <StatCard
            title="Digital UPI Sales"
            value={formatCurrency(currentRegister.upi_sales || 0)}
            icon={<QrCode className="w-5 h-5" />}
            color="blue"
          />
        </div>

        <Card className="p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Shift Tally Breakdown
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Opening Cash Float:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(currentRegister.opening_float)}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">+ Cash Collected:</span>
              <span className="font-semibold text-emerald-600">+{formatCurrency(currentRegister.cash_sales)}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">- Cash Drops to Safe:</span>
              <span className="font-semibold text-rose-600">-{formatCurrency(currentRegister.cash_out)}</span>
            </div>
            <div className="py-3 flex justify-between font-black text-base text-slate-900 dark:text-white">
              <span>Current Cash in Till:</span>
              <span className="text-amber-600 font-['Outfit']">{formatCurrency(currentRegister.expected_cash)}</span>
            </div>
          </div>
        </Card>
      </div>

      <CashDrawerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
      />
    </EmployeeLayout>
  );
};
export default ShiftCash;
