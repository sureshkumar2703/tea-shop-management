import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { dataService } from "@/services/supabaseService";
import { useAuthStore } from "@/stores/authStore";
import { Order, InventoryItem, Product, Datepay } from "@/types";
import { formatCurrency, formatDateTime, formatDate, getLocalDateStr, isSameLocalDate } from "@/lib/utils";
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
  Lock,
  Calendar,
  Layers,
} from "lucide-react";
import { CreateExpenseModal } from "@/components/modals/CreateExpenseModal";

export const AdminDashboard: React.FC = () => {
  const { shop } = useAuthStore();
  const shopId = shop?.id || "a1111111-1111-1111-1111-111111111111";

  const todayStr = getLocalDateStr(new Date());

  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [todayDatepay, setTodayDatepay] = useState<Datepay | null>(null);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);

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

  const loadDashboardData = async () => {
    // 1. Fetch Orders for Today Only in local date
    const allOrders = await dataService.getOrders(shopId);
    const filteredToday = allOrders.filter(
      (o) => isSameLocalDate(o.created_at, todayStr) || o.created_at?.startsWith(todayStr)
    );
    setTodayOrders(filteredToday);

    // 2. Fetch Products & Active Count
    const allProds = await dataService.getProducts(shopId);
    setProducts(allProds);

    // 3. Fetch Inventory
    const inv = await dataService.getInventory(shopId);
    setInventory(inv);
    setLowStockItems(inv.filter((item) => item.current_stock <= item.min_alert_threshold));

    // 4. Fetch Today's Datepay
    const dp = await dataService.getTodayDatepay(shopId, todayStr);
    setTodayDatepay(dp);

    // 5. Calculate Live Today Metrics
    const metrics = await dataService.calculateDayMetrics(shopId, todayStr);
    setDayMetrics(metrics);
  };

  useEffect(() => {
    loadDashboardData();
  }, [shopId]);

  const isTodayOpen = todayDatepay?.status === "OPEN";
  const isTodayClosed = todayDatepay?.status === "CLOSED";
  const hasOpeningCash = isTodayOpen && !!todayDatepay?.investment_amount;

  const todayInvestment = isTodayOpen ? todayDatepay.investment_amount : 0;
  const todayGrossSales = dayMetrics.billingTotal;
  const todayCompletedTickets = todayOrders.length;

  // Real-time Net Balance & Expected Drawer Cash for Today
  const netBalance = isTodayOpen
    ? todayInvestment + dayMetrics.billingTotal - dayMetrics.expensesTotal - dayMetrics.purchasesTotal
    : 0;

  const expectedDrawerCash = isTodayOpen
    ? todayInvestment +
      dayMetrics.billingCash +
      dayMetrics.cashIn -
      dayMetrics.expensesCash -
      dayMetrics.purchasesCash -
      dayMetrics.cashOut
    : 0;

  const activeProductsCount = products.filter((p) => p.is_available !== false).length;

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
              Live floor activity, today's register balance, and kitchen inventory
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
                Daily Cash & Datepay
              </Button>
            </Link>
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
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Today's Datepay Net Balance
              </span>
              {isTodayOpen && (
                <Badge variant="success" size="sm">
                  Active Today
                </Badge>
              )}
              {isTodayClosed && (
                <Badge variant="danger" size="sm">
                  Register Closed
                </Badge>
              )}
              {!todayDatepay && (
                <Badge variant="warning" size="sm">
                  Not Opened Today
                </Badge>
              )}
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {formatCurrency(netBalance)}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {isTodayOpen ? (
                  `(Owner Float ${formatCurrency(todayInvestment)} + Billing ${formatCurrency(
                    todayGrossSales
                  )} - Expenses ${formatCurrency(dayMetrics.expensesTotal)} - Purchases ${formatCurrency(
                    dayMetrics.purchasesTotal
                  )})`
                ) : (
                  "(Enter morning opening cash in Datepay to start today's balance)"
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Link to="/admin/datepay" className="w-full md:w-auto">
              <Button size="sm" variant="amber" icon={<TrendingUp className="w-3.5 h-3.5" />}>
                {isTodayOpen ? "Manage Datepay" : "Enter Opening Cash"}
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
            value={formatCurrency(todayGrossSales)}
            icon={<TrendingUp className="w-5 h-5" />}
            subtitle={`${todayCompletedTickets} tickets processed today`}
            color="emerald"
          />
          <StatCard
            title="Cash in Register (Today)"
            value={isTodayOpen ? formatCurrency(expectedDrawerCash) : "₹0.00"}
            icon={<Banknote className="w-5 h-5" />}
            subtitle={
              isTodayOpen
                ? `Owner Float: ${formatCurrency(todayInvestment)}`
                : isTodayClosed
                ? "Register Closed"
                : "Not Opened Yet"
            }
            color="amber"
          />
          <StatCard
            title="Active Menu Items"
            value={`${activeProductsCount} Items`}
            icon={<Coffee className="w-5 h-5" />}
            subtitle="Available on POS menu"
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

        {/* Split Grid: Live Recent Orders & Fast Inventory Levels with Inside Scroll */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders List (2 Cols) with Inside Scroll */}
          <Card className="lg:col-span-2 p-6 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-amber-500" />
                    Live Counter Tickets (Today)
                  </h2>
                  <p className="text-xs text-slate-500">
                    {todayOrders.length} orders recorded for {formatDate(todayStr)}
                  </p>
                </div>
                <Link
                  to="/admin/billing"
                  className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                >
                  Go to POS <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Inside Scroll Container for Today's Tickets */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin mt-2">
                {todayOrders.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700 opacity-60" />
                    No counter tickets processed yet today.
                  </div>
                ) : (
                  todayOrders.map((order) => (
                    <div key={order.id} className="py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {order.order_number}
                          </span>
                          <Badge variant="neutral" size="sm">
                            {order.order_type}
                          </Badge>
                          <Badge variant={order.payment_method === "CASH" ? "warning" : "success"} size="sm">
                            {order.payment_method}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          {order.customer_name} &bull; {order.items?.length || 1} items &bull;{" "}
                          {formatDateTime(order.created_at)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-sm text-amber-600 dark:text-amber-400 block font-mono">
                          {formatCurrency(order.total_amount)}
                        </span>
                        <span className="text-[11px] text-emerald-600 flex items-center justify-end gap-1 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Paid
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>

          {/* Quick Raw Ingredients Snapshot (1 Col) with Inside Scroll */}
          <Card className="p-6 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-500" />
                    Ingredient Levels
                  </h2>
                  <p className="text-xs text-slate-500">Raw kitchen supplies ({inventory.length} items)</p>
                </div>
                <Link
                  to="/admin/stock"
                  className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Inside Scroll Container for Inventory */}
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin mt-2">
                {inventory.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No ingredient items found.
                  </div>
                ) : (
                  inventory.map((item) => {
                    const isLow = item.current_stock <= item.min_alert_threshold;
                    const percent = Math.min(100, Math.round((item.current_stock / (item.ideal_stock || 25)) * 100));

                    return (
                      <div key={item.id} className="space-y-1.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-700 dark:text-slate-200">{item.name}</span>
                          <span className={isLow ? "text-rose-600 font-bold" : "text-slate-500 font-mono"}>
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
                  })
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <CreateExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSuccess={() => loadDashboardData()}
      />
    </AdminLayout>
  );
};
export default AdminDashboard;
