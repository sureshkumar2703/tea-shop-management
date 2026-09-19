import React, { useState, useEffect } from "react";
import { EmployeeLayout } from "@/layouts/EmployeeLayout";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { dataService } from "@/services/supabaseService";
import { Order, Expense } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  Receipt,
  Banknote,
  QrCode,
  DollarSign,
  TrendingUp,
  Calendar,
  Layers,
  Filter,
  CheckCircle2,
  Coffee,
} from "lucide-react";

type PeriodTab = "DAY" | "WEEK" | "MONTH";
type ViewSection = "BILLS" | "EXPENSES";

export const ShiftReports: React.FC = () => {
  const [period, setPeriod] = useState<PeriodTab>("DAY");
  const [activeSection, setActiveSection] = useState<ViewSection>("BILLS");
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [allOrders, allExpenses] = await Promise.all([
        dataService.getOrders(),
        dataService.getExpenses(),
      ]);
      setOrders(allOrders);
      setExpenses(allExpenses);
      setIsLoading(false);
    }
    loadData();
  }, []);

  // Filter based on period
  const filterByPeriod = (dateStr: string): boolean => {
    const itemDate = new Date(dateStr);
    const now = new Date();

    if (period === "DAY") {
      return (
        itemDate.getFullYear() === now.getFullYear() &&
        itemDate.getMonth() === now.getMonth() &&
        itemDate.getDate() === now.getDate()
      );
    }

    if (period === "WEEK") {
      const diffTime = Math.abs(now.getTime() - itemDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }

    if (period === "MONTH") {
      return (
        itemDate.getFullYear() === now.getFullYear() &&
        itemDate.getMonth() === now.getMonth()
      );
    }

    return true;
  };

  const filteredOrders = orders.filter((o) => filterByPeriod(o.created_at));
  const filteredExpenses = expenses.filter((e) =>
    filterByPeriod(e.expense_date || e.created_at)
  );

  // Billing aggregates
  const totalBillsCount = filteredOrders.length;
  const totalBillingAmount = filteredOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const cashBilling = filteredOrders
    .filter((o) => o.payment_method === "CASH" || o.payment_method === "SPLIT")
    .reduce((sum, o) => sum + (o.cash_amount ?? (o.payment_method === "CASH" ? o.total_amount : 0)), 0);
  const gpayBilling = filteredOrders
    .filter((o) => o.payment_method === "UPI_QR" || o.payment_method === "SPLIT")
    .reduce((sum, o) => sum + (o.gpay_amount ?? (o.payment_method === "UPI_QR" ? o.total_amount : 0)), 0);

  // Expense aggregates
  const totalExpensesCount = filteredExpenses.length;
  const totalExpensesAmount = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Header and Period Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
              Shift Bills & Expenses Report
            </h1>
            <p className="text-xs text-slate-500">
              Detailed breakdown of counter bills and operational expenses for your shift
            </p>
          </div>

          {/* Period Selector Tabs: Day, Week, Month */}
          <div className="flex items-center bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            {(["DAY", "WEEK", "MONTH"] as PeriodTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setPeriod(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  period === tab
                    ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {tab === "DAY" ? "Today (Day)" : tab === "WEEK" ? "This Week" : "This Month"}
              </button>
            ))}
          </div>
        </div>

        {/* Section Selector: Bills vs Expenses */}
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            onClick={() => setActiveSection("BILLS")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeSection === "BILLS"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Bills Report ({filteredOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveSection("EXPENSES")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeSection === "EXPENSES"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Expenses Report ({filteredExpenses.length})</span>
          </button>
        </div>

        {/* KPI Summaries based on Period */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={`${period === "DAY" ? "Day" : period === "WEEK" ? "Week" : "Month"} Billing`}
            value={formatCurrency(totalBillingAmount)}
            icon={<TrendingUp className="w-5 h-5" />}
            subtitle={`${totalBillsCount} counter receipts`}
            color="amber"
          />
          <StatCard
            title="Cash Collected"
            value={formatCurrency(cashBilling)}
            icon={<Banknote className="w-5 h-5" />}
            subtitle="Cash in till"
            color="emerald"
          />
          <StatCard
            title="GPay / UPI Received"
            value={formatCurrency(gpayBilling)}
            icon={<QrCode className="w-5 h-5" />}
            subtitle="Direct QR payments"
            color="blue"
          />
          <StatCard
            title="Total Expenses"
            value={formatCurrency(totalExpensesAmount)}
            icon={<DollarSign className="w-5 h-5" />}
            subtitle={`${totalExpensesCount} recorded items`}
            color="purple"
          />
        </div>

        {/* Dynamic Content: BILLS VIEW */}
        {activeSection === "BILLS" && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold font-['Outfit'] text-slate-900 dark:text-white">
                  Bills Issued ({period === "DAY" ? "Today" : period === "WEEK" ? "This Week" : "This Month"})
                </h2>
                <p className="text-xs text-slate-500">
                  Detailed register receipts with items, portion/weight sizing, and payment modes
                </p>
              </div>
              <Badge variant="neutral">
                Total: {formatCurrency(totalBillingAmount)}
              </Badge>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-500" />
                <p className="font-semibold text-sm">No bills recorded for this period</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Bill / Order #</th>
                      <th className="px-4 py-3">Date & Time</th>
                      <th className="px-4 py-3">Customer / Mode</th>
                      <th className="px-4 py-3">Items Purchased</th>
                      <th className="px-4 py-3">Payment Split</th>
                      <th className="px-4 py-3 text-right">Bill Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          {order.order_number}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {formatDateTime(order.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                            {order.customer_name || "Walk-in Guest"}
                          </div>
                          <Badge
                            variant={
                              order.payment_method === "CASH"
                                ? "warning"
                                : order.payment_method === "UPI_QR"
                                ? "info"
                                : "neutral"
                            }
                            size="sm"
                          >
                            {order.payment_method === "UPI_QR" ? "GPAY / UPI" : order.payment_method === "SPLIT" ? "BOTH (SPLIT)" : order.payment_method}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                          {order.items && order.items.length > 0 ? (
                            order.items.map((it, idx) => (
                              <div key={idx}>
                                &bull; {it.product_name}{" "}
                                {it.size_variant && (
                                  <span className="text-amber-600 font-bold">
                                    ({it.size_variant})
                                  </span>
                                )}
                                {it.weight_grams && (
                                  <span className="text-blue-600 font-bold">
                                    ({it.weight_grams}g)
                                  </span>
                                )}
                                {it.weight_kg && (
                                  <span className="text-blue-600 font-bold">
                                    ({it.weight_kg}kg)
                                  </span>
                                )}{" "}
                                &times; {it.quantity}
                              </div>
                            ))
                          ) : (
                            <span>{order.customer_name || "Standard order"}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {order.payment_method === "SPLIT" ? (
                            <span className="text-purple-600 font-medium">
                              Cash: {formatCurrency(order.cash_amount || 0)} | GPay:{" "}
                              {formatCurrency(order.gpay_amount || 0)}
                            </span>
                          ) : order.payment_method === "CASH" ? (
                            <span className="text-amber-600 font-medium">Full Cash</span>
                          ) : (
                            <span className="text-blue-600 font-medium">Full GPay / UPI</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-bold text-amber-600 text-right">
                          {formatCurrency(order.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Dynamic Content: EXPENSES VIEW */}
        {activeSection === "EXPENSES" && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold font-['Outfit'] text-slate-900 dark:text-white">
                  Operational Expenses ({period === "DAY" ? "Today" : period === "WEEK" ? "This Week" : "This Month"})
                </h2>
                <p className="text-xs text-slate-500">
                  Logged tea shop expenses for milk, spices, snacks, and daily utilities
                </p>
              </div>
              <Badge variant="danger">
                Total: {formatCurrency(totalExpensesAmount)}
              </Badge>
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30 text-rose-500" />
                <p className="font-semibold text-sm">No expenses logged for this period</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Expense Title / Item</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Payment Mode</th>
                      <th className="px-4 py-3">Recorded Date</th>
                      <th className="px-4 py-3">Notes / Vendor</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {exp.title}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="neutral" size="sm">
                            {exp.category}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="warning" size="sm">
                            {exp.payment_method}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {exp.expense_date || formatDateTime(exp.created_at)}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {exp.notes || "General operational expense"}
                        </td>
                        <td className="px-4 py-3 font-bold text-rose-600 text-right">
                          {formatCurrency(exp.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </EmployeeLayout>
  );
};
export default ShiftReports;
