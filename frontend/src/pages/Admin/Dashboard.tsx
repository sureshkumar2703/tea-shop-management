import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { dataService } from "@/services/supabaseService";
import { Order, InventoryItem, CashRegister } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  Receipt,
  Banknote,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Package,
  Plus,
  Coffee,
  CheckCircle2,
} from "lucide-react";
import { CreateExpenseModal } from "@/components/modals/CreateExpenseModal";
import { CashDrawerModal } from "@/components/modals/CashDrawerModal";

export const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [register, setRegister] = useState<CashRegister | null>(null);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [drawerModalOpen, setDrawerModalOpen] = useState(false);

  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [datepayMetrics, setDatepayMetrics] = useState({
    billingCash: 0,
    billingGpay: 0,
    billingTotal: 0,
    expensesTotal: 0,
  });
  const [todayInvestment, setTodayInvestment] = useState<number>(2000);

  useEffect(() => {
    dataService.getOrders().then(setOrders);
    dataService.getInventory().then((inv) => {
      setInventory(inv);
      setLowStockItems(inv.filter((item) => item.current_stock <= item.min_alert_threshold));
    });
    dataService.getActiveRegister().then(setRegister);

    const todayStr = new Date().toISOString().split("T")[0];
    dataService.calculateDayMetrics("a1111111-1111-1111-1111-111111111111", todayStr).then(setDatepayMetrics);
    dataService.getDatepays("a1111111-1111-1111-1111-111111111111").then((list) => {
      const todayEntry = list.find((d) => d.date === todayStr);
      if (todayEntry) {
        setTodayInvestment(todayEntry.investment_amount);
      }
    });
  }, []);

  const totalDailyRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalDailyOrders = orders.length;
  // Datepay Formula: Investment + Total Billing - Total Expenses
  const netBalance = todayInvestment + (datepayMetrics.billingTotal || totalDailyRevenue) - datepayMetrics.expensesTotal;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top greeting & fast-action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-slate-900 dark:text-white tracking-tight">
              Store Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Live floor activity, register balance, and kitchen inventory
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/admin/billing">
              <Button variant="primary" icon={<Receipt className="w-4 h-4" />}>
                Launch POS Billing
              </Button>
            </Link>
            <Link to="/admin/datepay">
              <Button variant="amber" icon={<TrendingUp className="w-4 h-4" />}>
                Datepay & Daily Tally
              </Button>
            </Link>
            <Button
              variant="outline"
              icon={<Banknote className="w-4 h-4" />}
              onClick={() => setDrawerModalOpen(true)}
            >
              Cash Drawer
            </Button>
            <Button
              variant="secondary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setExpenseModalOpen(true)}
            >
              Log Expense
            </Button>
          </div>
        </div>

        {/* Datepay Quick Reconciliation Strip */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-emerald-500/10 border border-amber-400/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Today's Datepay Net Balance
              </span>
              <Badge variant="warning" size="sm">Active Today</Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {formatCurrency(netBalance)}
              </span>
              <span className="text-xs text-slate-500">
                (Investment ₹{todayInvestment} + Billing ₹{datepayMetrics.billingTotal || totalDailyRevenue} - Expenses ₹{datepayMetrics.expensesTotal})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Link to="/admin/datepay" className="w-full md:w-auto">
              <Button size="sm" variant="amber" icon={<TrendingUp className="w-3.5 h-3.5" />}>
                Manage Datepay
              </Button>
            </Link>
            <Link to="/admin/admins/new" className="w-full md:w-auto">
              <Button size="sm" variant="outline" icon={<Plus className="w-3.5 h-3.5" />}>
                + Co-Admin
              </Button>
            </Link>
          </div>
        </div>

        {/* Store Key Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Today's Gross Sales"
            value={formatCurrency(totalDailyRevenue)}
            icon={<TrendingUp className="w-5 h-5" />}
            trend={{ value: "+14.2% vs yesterday", isPositive: true }}
            subtitle={`${totalDailyOrders} completed tickets`}
            color="emerald"
          />
          <StatCard
            title="Cash in Register"
            value={formatCurrency(register?.expected_cash || 0)}
            icon={<Banknote className="w-5 h-5" />}
            subtitle={`Float: ${formatCurrency(register?.opening_float || 1000)}`}
            color="amber"
          />
          <StatCard
            title="Active Menu Items"
            value="18 Varieties"
            icon={<Coffee className="w-5 h-5" />}
            subtitle="Chai, iced coolers, buns & samosas"
            color="blue"
          />
          <StatCard
            title="Low Stock Alerts"
            value={lowStockItems.length}
            icon={<AlertTriangle className="w-5 h-5" />}
            subtitle={lowStockItems.length > 0 ? "Reorder needed" : "All stocks healthy"}
            color={lowStockItems.length > 0 ? "purple" : "emerald"}
          />
        </div>

        {/* Low Stock Warning Box (if any) */}
        {lowStockItems.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-white shadow-sm">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                  Ingredients Falling Below Minimum Threshold!
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  {lowStockItems.map((i) => `${i.name} (${i.current_stock} ${i.unit})`).join(", ")}
                </p>
              </div>
            </div>
            <Link to="/admin/stock">
              <Button size="sm" variant="amber">
                Order Restock
              </Button>
            </Link>
          </div>
        )}

        {/* Split Grid: Live Recent Orders & Fast Inventory Levels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders List (2 Cols) */}
          <Card className="lg:col-span-2 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold font-['Outfit'] text-slate-900 dark:text-white">
                  Live Counter Tickets
                </h2>
                <p className="text-xs text-slate-500">Most recent orders processed through POS</p>
              </div>
              <Link
                to="/admin/billing"
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                Go to POS <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {order.order_number}
                      </span>
                      <Badge variant="neutral" size="sm">
                        {order.order_type}
                      </Badge>
                      <Badge variant="success" size="sm">
                        {order.payment_method}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      {order.customer_name} &bull; {order.items?.length || 1} items &bull;{" "}
                      {formatDateTime(order.created_at)}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-sm text-amber-600 dark:text-amber-400 block">
                      {formatCurrency(order.total_amount)}
                    </span>
                    <span className="text-[11px] text-emerald-600 flex items-center justify-end gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Paid
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Raw Ingredients Snapshot (1 Col) */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold font-['Outfit'] text-slate-900 dark:text-white">
                  Ingredient Levels
                </h2>
                <p className="text-xs text-slate-500">Raw kitchen supplies</p>
              </div>
              <Link
                to="/admin/stock"
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {inventory.slice(0, 5).map((item) => {
                const isLow = item.current_stock <= item.min_alert_threshold;
                const percent = Math.min(100, Math.round((item.current_stock / (item.ideal_stock || 25)) * 100));

                return (
                  <div key={item.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-200">{item.name}</span>
                      <span className={isLow ? "text-rose-600" : "text-slate-500"}>
                        {item.current_stock} {item.unit}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isLow ? "bg-rose-500" : "bg-emerald-500"}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <CreateExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSuccess={() => {}}
      />
      <CashDrawerModal
        isOpen={drawerModalOpen}
        onClose={() => setDrawerModalOpen(false)}
      />
    </AdminLayout>
  );
};
export default AdminDashboard;
