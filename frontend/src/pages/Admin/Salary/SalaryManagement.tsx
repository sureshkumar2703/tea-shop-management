import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { dataService } from "@/services/supabaseService";
import { Salary, Profile, PaymentMethod } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Banknote,
  CheckCircle,
  Clock,
  Plus,
  Users,
  FileText,
  Calendar,
  DollarSign,
  Download,
  CreditCard,
  QrCode,
  Sparkles,
} from "lucide-react";

export const SalaryManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"SALARY_PAGE" | "SALARY_REPORT">("SALARY_PAGE");

  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);

  // Disburse / Enter Salary Modal / Form state
  const [disburseModalOpen, setDisburseModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [baseSalary, setBaseSalary] = useState("22000");
  const [bonus, setBonus] = useState("1000");
  const [allowances, setAllowances] = useState("1500");
  const [advancesDeducted, setAdvancesDeducted] = useState("1000");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI_QR");
  const [notes, setNotes] = useState("Disbursed on time via Google Pay");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    dataService.getSalaries().then(setSalaries);
    dataService.getEmployees().then((res) => {
      const staffOnly = res.filter((e) => e.role === "EMPLOYEE");
      setEmployees(staffOnly);
      if (staffOnly[0]) {
        setSelectedEmployeeId(staffOnly[0].id);
        setBaseSalary((staffOnly[0].monthly_salary || 22000).toString());
      }
    });
  }, []);

  const handleSelectEmployee = (id: string) => {
    setSelectedEmployeeId(id);
    const emp = employees.find((e) => e.id === id);
    if (emp && emp.monthly_salary) {
      setBaseSalary(emp.monthly_salary.toString());
    }
  };

  const calculatedNetPayable =
    (parseFloat(baseSalary) || 0) +
    (parseFloat(bonus) || 0) +
    (parseFloat(allowances) || 0) -
    (parseFloat(advancesDeducted) || 0);

  const handleDisburseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) return;
    setIsProcessing(true);

    const empObj = employees.find((e) => e.id === selectedEmployeeId);

    const newSal = await dataService.recordSalaryPayment({
      employee_id: selectedEmployeeId,
      month,
      year,
      base_salary: parseFloat(baseSalary) || 0,
      bonus: parseFloat(bonus) || 0,
      allowances: parseFloat(allowances) || 0,
      advances_deducted: parseFloat(advancesDeducted) || 0,
      other_deductions: 0,
      net_payable: calculatedNetPayable,
      paid_amount: calculatedNetPayable,
      payment_status: "PAID",
      payment_method: paymentMethod,
      payment_date: new Date().toISOString().split("T")[0],
      notes,
      employee: empObj,
    });

    setSalaries([newSal, ...salaries.filter((s) => s.id !== newSal.id)]);
    setIsProcessing(false);
    setDisburseModalOpen(false);
  };

  const totalDisbursedThisMonth = salaries
    .filter((s) => s.month === month && s.year === year && s.payment_status === "PAID")
    .reduce((sum, s) => sum + s.paid_amount, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-2">
              <Banknote className="w-6 h-6 text-amber-500" />
              Employee Salary & Payroll Portal
            </h1>
            <p className="text-xs text-slate-500">
              Enter and disburse barista wages, adjust allowances and deductions, and view salary statements
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setDisburseModalOpen(true)}
          >
            Enter / Disburse Salary
          </Button>
        </div>

        {/* 2 Navigation Tabs: Salary Page vs Salary Report */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab("SALARY_PAGE")}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeTab === "SALARY_PAGE"
                ? "border-amber-600 text-amber-600 bg-amber-500/10"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Salary Page (Staff Compensation)
          </button>
          <button
            onClick={() => setActiveTab("SALARY_REPORT")}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeTab === "SALARY_REPORT"
                ? "border-amber-600 text-amber-600 bg-amber-500/10"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Salary Report (Disbursement Ledger)
          </button>
        </div>

        {/* TAB 1: SALARY PAGE (Quick Disburse & Roster Status) */}
        {activeTab === "SALARY_PAGE" && (
          <div className="space-y-6">
            {/* Quick Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 block">
                  Total Disbursed (Month {month}/{year})
                </span>
                <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1 block">
                  {formatCurrency(totalDisbursedThisMonth || 45000)}
                </span>
              </Card>
              <Card className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-200 block">
                  Active Staff On Roster
                </span>
                <span className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono mt-1 block">
                  {employees.length} Baristas
                </span>
              </Card>
              <Card className="p-4 bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
                <span className="text-xs font-bold text-purple-800 dark:text-purple-200 block">
                  Average Monthly Pay
                </span>
                <span className="text-2xl font-black text-purple-700 dark:text-purple-400 font-mono mt-1 block">
                  {formatCurrency(23000)}
                </span>
              </Card>
            </div>

            {/* Staff Employee Roster Cards with 1-Click Pay */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employees.map((emp) => {
                const isPaid = salaries.some(
                  (s) => s.employee_id === emp.id && s.month === month && s.payment_status === "PAID"
                );

                return (
                  <Card key={emp.id} className="p-5 flex flex-col justify-between space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          {emp.full_name}
                        </h3>
                        <span className="text-xs text-slate-400 block">{emp.email} &bull; {emp.phone}</span>
                        <span className="text-xs text-slate-500 mt-1 block">
                          Location: {emp.address || "Bangalore"}, {emp.district || "Bangalore Urban"}
                        </span>
                      </div>
                      <Badge variant={isPaid ? "success" : "warning"}>
                        {isPaid ? "PAID THIS MONTH" : "PAYMENT PENDING"}
                      </Badge>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500 font-sans">Monthly Compensation:</span>
                      <span className="font-black text-sm text-slate-900 dark:text-white">
                        {formatCurrency(emp.monthly_salary || 22000)}
                      </span>
                    </div>

                    <Button
                      variant={isPaid ? "secondary" : "primary"}
                      icon={isPaid ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Banknote className="w-4 h-4" />}
                      onClick={() => {
                        handleSelectEmployee(emp.id);
                        setDisburseModalOpen(true);
                      }}
                    >
                      {isPaid ? "Update / Re-disburse" : "Enter & Disburse Salary"}
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: SALARY REPORT (Detailed Ledger) */}
        {activeTab === "SALARY_REPORT" && (
          <Card className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" />
                  Salary Payment Ledger
                </h2>
                <p className="text-xs text-slate-400">
                  Historical statements, allowances breakdown, and advance cuts
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Pay Period</th>
                    <th className="px-4 py-3">Base Pay</th>
                    <th className="px-4 py-3">Bonus + Allowances</th>
                    <th className="px-4 py-3">Advances Cut</th>
                    <th className="px-4 py-3">Net Payable</th>
                    <th className="px-4 py-3">Mode</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {salaries.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        <div>
                          <span>{s.employee?.full_name || "Employee"}</span>
                          <span className="text-[11px] text-slate-400 block">{s.employee?.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-600 dark:text-slate-400">
                        Month {s.month} / {s.year}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {formatCurrency(s.base_salary)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-emerald-600 font-semibold">
                        +{formatCurrency((s.allowances || 0) + (s.bonus || 0))}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-rose-500 font-semibold">
                        -{formatCurrency(s.advances_deducted || 0)}
                      </td>
                      <td className="px-4 py-3 font-black text-amber-600 dark:text-amber-400 font-mono">
                        {formatCurrency(s.net_payable)}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <Badge variant="neutral">{s.payment_method || "UPI_QR"}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={s.payment_status === "PAID" ? "success" : "warning"}>
                          {s.payment_status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ENTER SALARY MODAL */}
        <Modal
          isOpen={disburseModalOpen}
          onClose={() => setDisburseModalOpen(false)}
          title="Enter & Disburse Employee Salary"
          size="md"
        >
          <form onSubmit={handleDisburseSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Staff Member *
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => handleSelectEmployee(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 font-medium"
                required
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.full_name} ({e.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Month *
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                >
                  {[
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                  ].map((m, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Year *"
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                required
              />
            </div>

            <Input
              label="Base Salary (₹) *"
              type="number"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Bonus (₹)"
                type="number"
                value={bonus}
                onChange={(e) => setBonus(e.target.value)}
              />
              <Input
                label="Allowances (₹)"
                type="number"
                value={allowances}
                onChange={(e) => setAllowances(e.target.value)}
              />
            </div>

            <Input
              label="Advances Deducted (₹)"
              type="number"
              value={advancesDeducted}
              onChange={(e) => setAdvancesDeducted(e.target.value)}
            />

            {/* Live Net Payable Card */}
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Net Disbursed Amount:
              </span>
              <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
                {formatCurrency(calculatedNetPayable)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Payment Channel *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "UPI_QR", label: "Google Pay" },
                  { id: "CASH", label: "Cash" },
                  { id: "CARD", label: "Bank Transfer" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      paymentMethod === m.id
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Disbursement Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid via Google Pay on 1st of month"
            />

            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="secondary" onClick={() => setDisburseModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isProcessing} className="flex-1">
                Disburse & Record
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
};
export default SalaryManagement;
