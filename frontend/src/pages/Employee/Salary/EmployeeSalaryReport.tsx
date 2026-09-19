import React, { useState, useEffect } from "react";
import { EmployeeLayout } from "@/layouts/EmployeeLayout";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAuthStore } from "@/stores/authStore";
import { dataService } from "@/services/supabaseService";
import { Salary } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Printer,
  ShieldCheck,
  User,
  Coffee,
} from "lucide-react";

export const EmployeeSalaryReport: React.FC = () => {
  const { user, shop } = useAuthStore();
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [selectedSlip, setSelectedSlip] = useState<Salary | null>(null);
  const [slipModalOpen, setSlipModalOpen] = useState(false);

  useEffect(() => {
    dataService.getSalaries().then((all) => {
      // Filter for current employee, or fallback to mock salaries if user ID doesn't match
      const mySalaries = all.filter(
        (s) => s.employee_id === user?.id || s.employee?.email === user?.email
      );
      setSalaries(mySalaries.length > 0 ? mySalaries : all);
    });
  }, [user]);

  const totalDisbursed = salaries
    .filter((s) => s.payment_status === "PAID")
    .reduce((sum, s) => sum + s.paid_amount, 0);

  const baseSalary = user?.monthly_salary || 22000;
  const lastPayment = salaries.find((s) => s.payment_status === "PAID");

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
              My Salary Statements & Ledger
            </h1>
            <p className="text-xs text-slate-500">
              Verified monthly compensation, allowance disbursements, and downloadable pay slips
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="success" size="md">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Payroll Verified
            </Badge>
          </div>
        </div>

        {/* Employee Summary & Base Info */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 font-bold text-xl">
              {user?.full_name?.charAt(0) || "P"}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {user?.full_name || "Pooja Verma"}
                </h3>
                <Badge variant="info" size="sm">Barista & Counter Lead</Badge>
              </div>
              <p className="text-xs text-slate-500">
                Shop: <span className="font-medium text-slate-700 dark:text-slate-300">{shop?.name || "Chai Craft Artisan Bar"}</span> ({shop?.shop_code || "CC-8429"})
              </p>
              <p className="text-xs text-slate-500">
                Contact: {user?.phone || "+91 98765 43212"} &bull; {user?.email || "cashier@chaicraft.in"}
              </p>
            </div>
          </div>

          <div className="text-left md:text-right bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Contracted Base Salary
            </span>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {formatCurrency(baseSalary)} <span className="text-xs font-normal text-slate-400">/ mo</span>
            </div>
          </div>
        </div>

        {/* Salary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard
            title="Monthly Agreed Salary"
            value={formatCurrency(baseSalary)}
            icon={<Banknote className="w-5 h-5" />}
            subtitle="Fixed contractual wage"
            color="amber"
          />
          <StatCard
            title="Total Disbursed to Date"
            value={formatCurrency(totalDisbursed)}
            icon={<CheckCircle2 className="w-5 h-5" />}
            subtitle={`${salaries.filter((s) => s.payment_status === "PAID").length} payouts processed`}
            color="emerald"
          />
          <StatCard
            title="Latest Disbursement"
            value={lastPayment ? `${monthNames[lastPayment.month - 1]} ${lastPayment.year}` : "Up to date"}
            icon={<Calendar className="w-5 h-5" />}
            subtitle={lastPayment?.payment_date ? `Paid on ${formatDate(lastPayment.payment_date)}` : "All paid"}
            color="blue"
          />
        </div>

        {/* Historical Salary Statements Table */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold font-['Outfit'] text-slate-900 dark:text-white">
                Historical Monthly Salary Statements
              </h2>
              <p className="text-xs text-slate-500">
                Complete record of past disbursements with itemized allowances and deductions
              </p>
            </div>
            <Badge variant="neutral">
              {salaries.length} records
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Pay Period</th>
                  <th className="px-4 py-3">Base Salary</th>
                  <th className="px-4 py-3">Allowances & Bonus</th>
                  <th className="px-4 py-3">Deductions</th>
                  <th className="px-4 py-3">Net Paid Amount</th>
                  <th className="px-4 py-3">Disbursed Date & Mode</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Pay Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {salaries.map((sal) => (
                  <tr key={sal.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {monthNames[sal.month - 1]} {sal.year}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                      {formatCurrency(sal.base_salary)}
                    </td>
                    <td className="px-4 py-3 text-xs text-emerald-600 font-semibold">
                      +{formatCurrency(sal.allowances + sal.bonus)}
                    </td>
                    <td className="px-4 py-3 text-xs text-rose-600 font-semibold">
                      -{formatCurrency(sal.advances_deducted + (sal.other_deductions || 0))}
                    </td>
                    <td className="px-4 py-3 font-bold text-amber-600">
                      {formatCurrency(sal.paid_amount || sal.net_payable)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {sal.payment_date ? formatDate(sal.payment_date) : "Recent"}
                      </div>
                      <span className="text-slate-500">{sal.payment_method}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={sal.payment_status === "PAID" ? "success" : "warning"}
                        size="sm"
                      >
                        {sal.payment_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<FileText className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setSelectedSlip(sal);
                          setSlipModalOpen(true);
                        }}
                      >
                        View Slip
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Salary Slip Detail Modal */}
      {selectedSlip && (
        <Modal
          isOpen={slipModalOpen}
          onClose={() => setSlipModalOpen(false)}
          title={`Pay Slip: ${monthNames[selectedSlip.month - 1]} ${selectedSlip.year}`}
        >
          <div className="p-6 space-y-6">
            {/* Slip Header */}
            <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800 space-y-1">
              <h3 className="font-bold text-xl font-['Outfit'] text-slate-900 dark:text-white">
                {shop?.name || "Chai Craft Artisan Bar"}
              </h3>
              <p className="text-xs text-slate-500">
                Store Code: <span className="font-bold text-amber-600">{shop?.shop_code || "CC-8429"}</span> &bull; Payroll Voucher
              </p>
              <Badge variant="success" size="sm">
                CONFIRMED &amp; DISBURSED
              </Badge>
            </div>

            {/* Employee Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
              <div>
                <span className="text-slate-400 block">Employee:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {user?.full_name || selectedSlip.employee?.full_name || "Pooja Verma"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Designation:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Barista</span>
              </div>
              <div>
                <span className="text-slate-400 block">Disbursed On:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedSlip.payment_date ? formatDate(selectedSlip.payment_date) : "01-03-2026"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Payment Mode:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedSlip.payment_method}
                </span>
              </div>
            </div>

            {/* Salary Breakdown Lines */}
            <div className="space-y-2 text-sm border-t border-b border-slate-200 dark:border-slate-800 py-3">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Basic Monthly Wage</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(selectedSlip.base_salary)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Special Duty Allowances</span>
                <span className="font-semibold">+{formatCurrency(selectedSlip.allowances)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Performance Tea Bonus</span>
                <span className="font-semibold">+{formatCurrency(selectedSlip.bonus)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Advance Deductions</span>
                <span className="font-semibold">-{formatCurrency(selectedSlip.advances_deducted)}</span>
              </div>
              {selectedSlip.other_deductions > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Other Deductions</span>
                  <span className="font-semibold">-{formatCurrency(selectedSlip.other_deductions)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-700 flex justify-between font-extrabold text-base">
                <span className="text-slate-900 dark:text-white">Net Disbursed Take-Home</span>
                <span className="text-amber-600 dark:text-amber-400">
                  {formatCurrency(selectedSlip.paid_amount || selectedSlip.net_payable)}
                </span>
              </div>
            </div>

            {selectedSlip.notes && (
              <p className="text-xs text-slate-500 italic bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                Note: {selectedSlip.notes}
              </p>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => window.print()} icon={<Printer className="w-4 h-4" />}>
                Print Voucher
              </Button>
              <Button variant="primary" onClick={() => setSlipModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </EmployeeLayout>
  );
};
export default EmployeeSalaryReport;
