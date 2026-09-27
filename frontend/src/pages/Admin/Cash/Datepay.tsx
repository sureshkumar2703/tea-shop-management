import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useAuthStore } from "@/stores/authStore";
import { useRegisterStore } from "@/stores/registerStore";
import { dataService } from "@/services/supabaseService";
import { Datepay } from "@/types";
import { formatCurrency, formatDate, getLocalDateStr } from "@/lib/utils";
import {
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
  Truck,
  RefreshCw,
  Lock,
  Unlock,
  AlertTriangle,
  Coins,
  History,
} from "lucide-react";

export const DatepayPage: React.FC = () => {
  const navigate = useNavigate();
  const { shop } = useAuthStore();
  const shopId = shop?.id || "a1111111-1111-1111-1111-111111111111";
  const { openDayRegister, closeDayRegister, refreshRegister } = useRegisterStore();

  const todayStr = getLocalDateStr(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [investmentAmount, setInvestmentAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [currentDatepay, setCurrentDatepay] = useState<Datepay | null>(null);
  const [datepays, setDatepays] = useState<Datepay[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Close Register Modal State
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [actualCashCount, setActualCashCount] = useState<string>("");
  const [closingRemarks, setClosingRemarks] = useState<string>("");
  const [isClosing, setIsClosing] = useState<boolean>(false);

  // Day metrics calculated live from orders, expenses, purchases & drawer movements
  const [dayMetrics, setDayMetrics] = useState({
    billingCash: 0,
    billingGpay: 0,
    billingCard: 0,
    billingTotal: 0,
    expensesTotal: 0,
    expensesCash: 0,
    expensesOnline: 0,
    purchasesTotal: 0,
    purchasesCash: 0,
    purchasesOnline: 0,
    cashIn: 0,
    cashOut: 0,
  });

  const loadData = async (date: string) => {
    setIsLoading(true);
    const list = await dataService.getDatepays(shopId);
    setDatepays(list);

    // Check if an existing datepay entry exists for this date
    const existing = list.find((d) => d.date === date);
    if (existing) {
      setCurrentDatepay(existing);
      setInvestmentAmount(existing.investment_amount ? existing.investment_amount.toString() : "");
      setNotes(existing.notes || "");
    } else {
      setCurrentDatepay(null);
      setInvestmentAmount("");
      setNotes("");
    }

    // Calculate live billing, expenses, purchases & drawer movements for the date
    const metrics = await dataService.calculateDayMetrics(shopId, date);
    setDayMetrics(metrics);
    await refreshRegister(shopId);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  const investmentNum = parseFloat(investmentAmount) || 0;
  const billingTotalNum = dayMetrics.billingTotal;
  const expensesTotalNum = dayMetrics.expensesTotal;
  const purchasesTotalNum = dayMetrics.purchasesTotal;

  // Master Calculation Formula:
  // Net Day Balance = Investment + Total Billing - Total Expenses - Total Purchases
  const calculatedNetBalance = investmentNum + billingTotalNum - expensesTotalNum - purchasesTotalNum;

  // Physical Counter Cash in Hand = Investment + Cash Billing + Cash In - Cash Expenses - Cash Purchases - Cash Out
  const estimatedCashInHand =
    investmentNum +
    dayMetrics.billingCash +
    dayMetrics.cashIn -
    dayMetrics.expensesCash -
    dayMetrics.purchasesCash -
    dayMetrics.cashOut;

  const handleSaveAndOpen = async () => {
    setIsLoading(true);
    setSaveSuccess(false);

    if (selectedDate === todayStr) {
      await openDayRegister(shopId, investmentNum, notes);
    } else {
      await dataService.saveDatepay({
        id: currentDatepay?.id,
        shop_id: shopId,
        date: selectedDate,
        investment_amount: investmentNum,
        total_billing_cash: dayMetrics.billingCash,
        total_billing_gpay: dayMetrics.billingGpay,
        total_billing: billingTotalNum,
        total_expenses: expensesTotalNum + purchasesTotalNum,
        calculated_balance: calculatedNetBalance,
        actual_closing_cash: estimatedCashInHand,
        status: "OPEN",
        notes,
      });
    }

    await loadData(selectedDate);
    setIsLoading(false);
    setSuccessMessage("Daily opening cash recorded & register is now OPEN!");
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleOpenCloseModal = () => {
    setActualCashCount(estimatedCashInHand.toString());
    setClosingRemarks(currentDatepay?.notes || "End of day settlement and cash reconciliation");
    setCloseModalOpen(true);
  };

  const handleConfirmCloseRegister = async () => {
    setIsClosing(true);
    const countedCash = parseFloat(actualCashCount) || 0;

    if (selectedDate === todayStr) {
      await closeDayRegister(shopId, countedCash, closingRemarks);
    } else {
      await dataService.saveDatepay({
        id: currentDatepay?.id,
        shop_id: shopId,
        date: selectedDate,
        investment_amount: investmentNum,
        total_billing_cash: dayMetrics.billingCash,
        total_billing_gpay: dayMetrics.billingGpay,
        total_billing: billingTotalNum,
        total_expenses: expensesTotalNum + purchasesTotalNum,
        calculated_balance: calculatedNetBalance,
        actual_closing_cash: countedCash,
        status: "CLOSED",
        notes: closingRemarks,
      });
    }

    setCloseModalOpen(false);
    setIsClosing(false);
    await loadData(selectedDate);
    setSuccessMessage("Register successfully SETTLED & CLOSED for this day!");
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const isToday = selectedDate === todayStr;
  const isDateClosed = currentDatepay?.status === "CLOSED";
  const isDateOpen = currentDatepay?.status === "OPEN";
  const isNotOpenedYet = !currentDatepay;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-6 h-6 text-amber-500" />
                Owner Daily Cash Entry & Datepay Tally
              </h1>
              {isDateOpen && (
                <Badge variant="success" size="md" className="animate-pulse">
                  REGISTER OPEN
                </Badge>
              )}
              {isDateClosed && (
                <Badge variant="danger" size="md">
                  REGISTER CLOSED
                </Badge>
              )}
              {isNotOpenedYet && (
                <Badge variant="warning" size="md">
                  NOT OPENED TODAY
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Enter morning opening cash float for the shop. Settle & close the day register to finalize daily accounts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<History className="w-3.5 h-3.5 text-amber-500" />}
              onClick={() => navigate("/admin/datepay/history")}
            >
              View Full History
            </Button>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
              <Calendar className="w-4 h-4 text-amber-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={() => loadData(selectedDate)}
              isLoading={isLoading}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Status Callout Banner */}
        {isDateClosed && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 dark:bg-rose-900/60 text-rose-600 rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                  Day Register is CLOSED for {formatDate(selectedDate)}
                </h3>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                  POS billing, new expenses, and purchases are locked for this day. To resume or modify, click Re-Open Register.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<Unlock className="w-4 h-4 text-amber-600" />}
              onClick={handleSaveAndOpen}
              className="border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900"
            >
              Re-Open Register
            </Button>
          </div>
        )}

        {isNotOpenedYet && isToday && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/60 text-amber-600 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Today's Opening Cash is Not Yet Entered
                </h3>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  Please enter the owner morning cash float below and click <strong>"Save & Open Day Register"</strong> to enable POS billing and expense tracking.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Master Financial Calculation Formula Strip */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-transparent border border-amber-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Master Financial Calculation Formula
            </span>
            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-1.5 font-mono">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-900 dark:text-amber-200">
                Owner Float ({formatCurrency(investmentNum)})
              </span>
              <span>+</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-900 dark:text-emerald-200">
                Billing ({formatCurrency(billingTotalNum)})
              </span>
              <span>-</span>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-900 dark:text-rose-200">
                Expenses ({formatCurrency(expensesTotalNum)})
              </span>
              <span>-</span>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-900 dark:text-purple-200">
                Purchases ({formatCurrency(purchasesTotalNum)})
              </span>
              <span>=</span>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-900 dark:text-blue-200 font-black text-sm">
                Net Balance: {formatCurrency(calculatedNetBalance)}
              </span>
            </div>
          </div>
          {saveSuccess && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl animate-fade-in shrink-0">
              <CheckCircle2 className="w-4 h-4" /> {successMessage}
            </div>
          )}
        </div>

        {/* 5 Financial Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Owner Daily Cash (Float)"
            value={formatCurrency(investmentNum)}
            icon={<Banknote className="w-5 h-5 text-amber-500" />}
            subtitle={`Capital for ${formatDate(selectedDate)}`}
            color="amber"
          />
          <StatCard
            title="Today's Billing Sales"
            value={formatCurrency(billingTotalNum)}
            icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
            subtitle={`Cash: ${formatCurrency(dayMetrics.billingCash)} | UPI: ${formatCurrency(dayMetrics.billingGpay)}`}
            color="emerald"
          />
          <StatCard
            title="Daily Shop Expenses"
            value={formatCurrency(expensesTotalNum)}
            icon={<Receipt className="w-5 h-5 text-rose-500" />}
            subtitle={`Cash: ${formatCurrency(dayMetrics.expensesCash)} | UPI: ${formatCurrency(dayMetrics.expensesOnline)}`}
            color="amber"
          />
          <StatCard
            title="Supplier Purchases"
            value={formatCurrency(purchasesTotalNum)}
            icon={<Truck className="w-5 h-5 text-purple-500" />}
            subtitle={`Cash: ${formatCurrency(dayMetrics.purchasesCash)} | UPI: ${formatCurrency(dayMetrics.purchasesOnline)}`}
            color="purple"
          />
          <StatCard
            title="Expected Drawer Cash"
            value={formatCurrency(estimatedCashInHand)}
            icon={<Calculator className="w-5 h-5 text-blue-500" />}
            subtitle={`Net Day P&L: ${formatCurrency(calculatedNetBalance)}`}
            color="blue"
          />
        </div>

        {/* Datepay Entry Form & Live Split Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                Owner Daily Cash Entry & Shift Setup
              </h2>
              {isDateOpen && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active for {formatDate(selectedDate)}
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Input
                  label="Owner Morning Investment / Opening Cash Float *"
                  type="number"
                  step="1"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder="Enter opening cash float (e.g. 2000)"
                  disabled={isDateClosed}
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Amount provided by shop owner for morning milk, supplies, and counter drawer change
                </span>
              </div>

              {/* Quick investment amount chips */}
              {!isDateClosed && (
                <div className="flex flex-wrap gap-2">
                  {[1000, 1500, 2000, 2500, 3000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setInvestmentAmount(amt.toString())}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                        investmentAmount === amt.toString()
                          ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 hover:bg-slate-100 dark:text-slate-300"
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              )}

              <div>
                <Input
                  label="Investment Notes & Shift Remarks"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Shift notes or remarks (optional)"
                  disabled={isDateClosed}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                {!isDateClosed ? (
                  <>
                    <Button
                      type="button"
                      variant="primary"
                      isLoading={isLoading}
                      icon={<Save className="w-4 h-4" />}
                      onClick={handleSaveAndOpen}
                      className="flex-1"
                    >
                      {currentDatepay?.status === "OPEN" ? "Update Opening Cash" : "Save & Open Day Register"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      isLoading={isLoading}
                      icon={<Lock className="w-4 h-4 text-rose-500" />}
                      onClick={handleOpenCloseModal}
                      className="flex-1 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      Settle & Close Day Register
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    isLoading={isLoading}
                    icon={<Unlock className="w-4 h-4 text-amber-500" />}
                    onClick={handleSaveAndOpen}
                    className="w-full"
                  >
                    Re-Open This Day's Register
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Revenue, Outflow & Cash Breakdown Card */}
          <Card className="p-6 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                Live Inflow & Outflow Breakdown
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Financial channels for {formatDate(selectedDate)}
              </p>

              <div className="space-y-2.5 mt-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-200 font-bold">
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                    Cash Billing Sales
                  </div>
                  <span className="font-black text-emerald-700 dark:text-emerald-400 font-mono">
                    +{formatCurrency(dayMetrics.billingCash)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 font-bold">
                    <QrCode className="w-3.5 h-3.5 text-amber-600" />
                    Google Pay / UPI
                  </div>
                  <span className="font-black text-amber-700 dark:text-amber-400 font-mono">
                    +{formatCurrency(dayMetrics.billingGpay)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-rose-900 dark:text-rose-200 font-bold">
                    <Receipt className="w-3.5 h-3.5 text-rose-600" />
                    Total Expenses
                  </div>
                  <span className="font-black text-rose-700 dark:text-rose-400 font-mono">
                    -{formatCurrency(expensesTotalNum)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-purple-900 dark:text-purple-200 font-bold">
                    <Truck className="w-3.5 h-3.5 text-purple-600" />
                    Total Purchases
                  </div>
                  <span className="font-black text-purple-700 dark:text-purple-400 font-mono">
                    -{formatCurrency(purchasesTotalNum)}
                  </span>
                </div>

                {(dayMetrics.cashIn > 0 || dayMetrics.cashOut > 0) && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      Drawer Drops / Cash In:
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      +{formatCurrency(dayMetrics.cashIn)} / -{formatCurrency(dayMetrics.cashOut)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 mt-3">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-500">Calculated Net Balance:</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-black text-sm">
                  {formatCurrency(calculatedNetBalance)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-1">
                <span>Expected Physical Cash in Drawer:</span>
                <span className="font-mono font-bold text-emerald-600">{formatCurrency(estimatedCashInHand)}</span>
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
            <span className="text-xs text-slate-400">{datepays.length} Recorded Days</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Owner Float</th>
                  <th className="px-4 py-3">Billing</th>
                  <th className="px-4 py-3">Expenses</th>
                  <th className="px-4 py-3">Net Balance</th>
                  <th className="px-4 py-3">Closing Cash</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {datepays.map((dp) => (
                  <tr
                    key={dp.id}
                    onClick={() => setSelectedDate(dp.date)}
                    className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                      dp.date === selectedDate ? "bg-amber-50/50 dark:bg-amber-950/20" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white font-mono text-xs">
                      {formatDate(dp.date)}
                    </td>
                    <td className="px-4 py-3 font-bold text-amber-600 font-mono">
                      {formatCurrency(dp.investment_amount)}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-600 font-mono">
                      +{formatCurrency(dp.total_billing)}
                    </td>
                    <td className="px-4 py-3 font-bold text-rose-500 font-mono">
                      -{formatCurrency(dp.total_expenses)}
                    </td>
                    <td className="px-4 py-3 font-black text-blue-600 dark:text-blue-400 font-mono">
                      {formatCurrency(dp.calculated_balance)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">
                      {dp.actual_closing_cash !== null && dp.actual_closing_cash !== undefined
                        ? formatCurrency(dp.actual_closing_cash)
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={dp.status === "CLOSED" ? "danger" : "success"}>
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

      {/* Settle & Close Day Register Modal */}
      <Modal
        isOpen={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        title="Settle & Close Day Register"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-2 text-xs">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-600 dark:text-slate-400">Date Being Closed:</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatDate(selectedDate)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-slate-600 dark:text-slate-400">Morning Float (Opening Cash):</span>
              <span className="font-mono text-amber-700 dark:text-amber-300 font-bold">{formatCurrency(investmentNum)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-slate-600 dark:text-slate-400">Calculated Net Balance:</span>
              <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{formatCurrency(calculatedNetBalance)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-amber-200 dark:border-amber-800 pt-1.5">
              <span className="text-slate-700 dark:text-slate-300">Expected Physical Drawer Cash:</span>
              <span className="font-mono text-emerald-600 font-black text-sm">{formatCurrency(estimatedCashInHand)}</span>
            </div>
          </div>

          <div>
            <Input
              label="Actual Counted Physical Cash (₹) *"
              type="number"
              value={actualCashCount}
              onChange={(e) => setActualCashCount(e.target.value)}
              placeholder="e.g. 2000"
              required
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Enter the exact physical cash counted in the drawer before closing
            </span>
          </div>

          <div>
            <Input
              label="Closing Audit Notes / Variance Reason"
              value={closingRemarks}
              onChange={(e) => setClosingRemarks(e.target.value)}
              placeholder="e.g. Cash balanced perfectly, handed over to safe"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-500 space-y-1">
            <p>&bull; Closing the register will set today's status to <strong>CLOSED</strong>.</p>
            <p>&bull; Billing, expense creation, and purchases will be locked for this date until next day's opening cash is entered.</p>
          </div>

          <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCloseModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={isClosing}
              icon={<Lock className="w-4 h-4" />}
              onClick={handleConfirmCloseRegister}
              className="flex-1"
            >
              Confirm & Close Register
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
};
export default DatepayPage;
