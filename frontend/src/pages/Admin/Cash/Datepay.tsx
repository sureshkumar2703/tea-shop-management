import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/stores/authStore";
import { dataService } from "@/services/supabaseService";
import { Datepay } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  DollarSign,
  Calculator,
  Calendar,
  Banknote,
  QrCode,
  TrendingUp,
  Receipt,
  CheckCircle2,
  Clock,
  Save,
  Layers,
} from "lucide-react";

export const DatepayPage: React.FC = () => {
  const { shop } = useAuthStore();
  const shopId = shop?.id || "a1111111-1111-1111-1111-111111111111";

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [investmentAmount, setInvestmentAmount] = useState<string>("2000");
  const [notes, setNotes] = useState<string>("Morning opening float for milk and snacks");
  const [datepays, setDatepays] = useState<Datepay[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Day metrics calculated live from orders & expenses
  const [dayMetrics, setDayMetrics] = useState({
    billingCash: 0,
    billingGpay: 0,
    billingTotal: 0,
    expensesTotal: 0,
  });

  const loadData = async (date: string) => {
    const list = await dataService.getDatepays(shopId);
    setDatepays(list);

    // Check if an existing datepay entry exists for this date
    const existing = list.find((d) => d.date === date);
    if (existing) {
      setInvestmentAmount(existing.investment_amount.toString());
      setNotes(existing.notes || "");
    }

    // Calculate live billing & expenses for the date
    const metrics = await dataService.calculateDayMetrics(shopId, date);
    setDayMetrics(metrics);
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  const investmentNum = parseFloat(investmentAmount) || 0;
  const billingTotalNum = dayMetrics.billingTotal;
  const expensesTotalNum = dayMetrics.expensesTotal;

  // Key Formula: Calculated Balance = Investment Amount + Total Billing - Total Expenses
  const calculatedNetBalance = investmentNum + billingTotalNum - expensesTotalNum;
  const estimatedCashInHand = investmentNum + dayMetrics.billingCash - expensesTotalNum;

  const handleSaveDatepay = async (status: "OPEN" | "CLOSED" = "OPEN") => {
    setIsLoading(true);
    setSaveSuccess(false);

    await dataService.saveDatepay({
      shop_id: shopId,
      date: selectedDate,
      investment_amount: investmentNum,
      total_billing_cash: dayMetrics.billingCash,
      total_billing_gpay: dayMetrics.billingGpay,
      total_billing: billingTotalNum,
      total_expenses: expensesTotalNum,
      calculated_balance: calculatedNetBalance,
      actual_closing_cash: estimatedCashInHand,
      status,
      notes,
    });

    await loadData(selectedDate);
    setIsLoading(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-6 h-6 text-amber-500" />
              Datepay & Daily Investment Balancing
            </h1>
            <p className="text-xs text-slate-500">
              Enter daily owner opening float, track sales collections and daily expenses, and balance the register
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
              <Calendar className="w-4 h-4 text-amber-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Financial Formula Callout */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Datepay Balancing Formula
            </span>
            <div className="text-sm font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-1.5 font-mono">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-900 dark:text-amber-200">
                Investment ({formatCurrency(investmentNum)})
              </span>
              <span>+</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-900 dark:text-emerald-200">
                Total Billing ({formatCurrency(billingTotalNum)})
              </span>
              <span>-</span>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-900 dark:text-rose-200">
                Expenses ({formatCurrency(expensesTotalNum)})
              </span>
              <span>=</span>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-900 dark:text-blue-200 font-black">
                {formatCurrency(calculatedNetBalance)}
              </span>
            </div>
          </div>
          {saveSuccess && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl animate-fade-in shrink-0">
              <CheckCircle2 className="w-4 h-4" /> Datepay Saved Successfully!
            </div>
          )}
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Owner Investment (Morning)"
            value={formatCurrency(investmentNum)}
            icon={<Banknote className="w-5 h-5 text-amber-500" />}
            subtitle={`Float for ${formatDate(selectedDate)}`}
            color="amber"
          />
          <StatCard
            title="Today's Billing Sales"
            value={formatCurrency(billingTotalNum)}
            icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
            subtitle={`Cash: ${formatCurrency(dayMetrics.billingCash)} | GPay: ${formatCurrency(dayMetrics.billingGpay)}`}
            color="emerald"
          />
          <StatCard
            title="Today's Total Expenses"
            value={formatCurrency(expensesTotalNum)}
            icon={<Receipt className="w-5 h-5 text-rose-500" />}
            subtitle="Milk, gas, spices & misc"
            color="blue"
          />
          <StatCard
            title="Calculated Day Net Balance"
            value={formatCurrency(calculatedNetBalance)}
            icon={<Calculator className="w-5 h-5 text-blue-500" />}
            subtitle={`Est. Cash in Hand: ${formatCurrency(estimatedCashInHand)}`}
            color="purple"
          />
        </div>

        {/* Datepay Entry Form & Live Split Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Save className="w-5 h-5 text-amber-500" />
              Enter / Adjust Day's Investment
            </h2>

            <div className="space-y-4">
              <div>
                <Input
                  label="Morning Investment Amount (Opening Float) *"
                  type="number"
                  step="1"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder="e.g. 2000"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Amount brought in by store owner for morning milk, supplies, and customer change
                </span>
              </div>

              {/* Quick investment amount chips */}
              <div className="flex gap-2">
                {[1000, 2000, 2500, 3000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setInvestmentAmount(amt.toString())}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                      investmentAmount === amt.toString()
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              <div>
                <Input
                  label="Investment Notes & Shift Remarks"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Added ₹500 extra float for evening milk batch delivery"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="primary"
                  isLoading={isLoading}
                  icon={<Save className="w-4 h-4" />}
                  onClick={() => handleSaveDatepay("OPEN")}
                  className="flex-1"
                >
                  Save Daypay (Keep Register Open)
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  isLoading={isLoading}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={() => handleSaveDatepay("CLOSED")}
                  className="flex-1"
                >
                  Settle & Close Day Register
                </Button>
              </div>
            </div>
          </Card>

          {/* Revenue Breakdown Card */}
          <Card className="p-6 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                Collection Breakdown
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Channel distribution for {formatDate(selectedDate)}
              </p>

              <div className="space-y-3 mt-4">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-emerald-900 dark:text-emerald-200 font-bold">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    Cash Billing Sales
                  </div>
                  <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 font-mono">
                    {formatCurrency(dayMetrics.billingCash)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200 font-bold">
                    <QrCode className="w-4 h-4 text-amber-600" />
                    Google Pay / UPI
                  </div>
                  <span className="text-sm font-black text-amber-700 dark:text-amber-400 font-mono">
                    {formatCurrency(dayMetrics.billingGpay)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-rose-900 dark:text-rose-200 font-bold">
                    <Receipt className="w-4 h-4 text-rose-600" />
                    Total Day Expenses
                  </div>
                  <span className="text-sm font-black text-rose-700 dark:text-rose-400 font-mono">
                    -{formatCurrency(expensesTotalNum)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1 mt-4">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-500">Expected Total Balance:</span>
                <span className="font-mono text-slate-900 dark:text-white font-bold">
                  {formatCurrency(calculatedNetBalance)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Expected Physical Cash:</span>
                <span className="font-mono">{formatCurrency(estimatedCashInHand)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Historical Datepay Logs Table */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Datepay Daily Reconciliation Log
            </h2>
            <span className="text-xs text-slate-400">{datepays.length} Recorded Shifts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Morning Investment</th>
                  <th className="px-4 py-3">Total Billing</th>
                  <th className="px-4 py-3">Expenses</th>
                  <th className="px-4 py-3">Calculated Balance</th>
                  <th className="px-4 py-3">Actual Cash</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {datepays.map((dp) => (
                  <tr key={dp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white font-mono text-xs">
                      {formatDate(dp.date)}
                    </td>
                    <td className="px-4 py-3 font-bold text-amber-600 font-mono">
                      {formatCurrency(dp.investment_amount)}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-600 font-mono">
                      {formatCurrency(dp.total_billing)}
                    </td>
                    <td className="px-4 py-3 font-bold text-rose-500 font-mono">
                      -{formatCurrency(dp.total_expenses)}
                    </td>
                    <td className="px-4 py-3 font-black text-blue-600 dark:text-blue-400 font-mono">
                      {formatCurrency(dp.calculated_balance)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">
                      {dp.actual_closing_cash ? formatCurrency(dp.actual_closing_cash) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={dp.status === "CLOSED" ? "success" : "warning"}>
                        {dp.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">
                      {dp.notes || "No notes"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};
export default DatepayPage;
