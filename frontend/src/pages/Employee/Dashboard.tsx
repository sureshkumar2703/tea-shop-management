import React from "react";
import { Link } from "react-router-dom";
import { EmployeeLayout } from "@/layouts/EmployeeLayout";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/stores/authStore";
import { useRegisterStore } from "@/stores/registerStore";
import { formatCurrency } from "@/lib/utils";
import { Receipt, Banknote, Coffee, Clock, ArrowRight, User, BarChart2 } from "lucide-react";

export const EmployeeDashboard: React.FC = () => {
  const { user, shop } = useAuthStore();
  const { currentRegister, isOpen } = useRegisterStore();

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
              Welcome back, {user?.full_name || "Barista"}!
            </h1>
            <p className="text-xs text-slate-500">
              Station: {shop?.name || "Chai Craft Artisan Bar"} &bull; Counter POS Terminal
            </p>
          </div>

          <Link to="/employee/billing">
            <Button variant="primary" size="lg" icon={<Receipt className="w-5 h-5" />}>
              Open POS Billing
            </Button>
          </Link>
        </div>

        {/* Shift Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard
            title="Active Shift Sales"
            value={formatCurrency((currentRegister.cash_sales || 0) + (currentRegister.upi_sales || 0))}
            icon={<Coffee className="w-5 h-5" />}
            subtitle="Today's processed tickets"
            color="amber"
          />
          <StatCard
            title="Drawer Cash On-Hand"
            value={formatCurrency(currentRegister.expected_cash || 0)}
            icon={<Banknote className="w-5 h-5" />}
            subtitle={`Float: ${formatCurrency(currentRegister.opening_float)}`}
            color="emerald"
          />
          <StatCard
            title="Shift Status"
            value={isOpen ? "CLOCK ACTIVE" : "TILL CLOSED"}
            icon={<Clock className="w-5 h-5" />}
            subtitle="Check-in verified"
            color="blue"
          />
        </div>

        {/* Quick Action Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 space-y-3 hover:border-amber-400 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Counter POS Billing
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fast tea orders, Regular/Thirsty sizes, and Split payments
                </p>
              </div>
            </div>
            <Link to="/employee/billing" className="block pt-2">
              <Button variant="primary" size="sm" className="w-full">
                Launch POS <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </Card>

          <Card className="p-5 space-y-3 hover:border-blue-400 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/30">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Bills & Expenses Report
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Day, Week, and Month reports for receipts and daily shop spends
                </p>
              </div>
            </div>
            <Link to="/employee/reports" className="block pt-2">
              <Button variant="outline" size="sm" className="w-full">
                View Reports <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </Card>

          <Card className="p-5 space-y-3 hover:border-emerald-400 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  My Salary Report
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Contracted salary, monthly disbursements, and pay slips
                </p>
              </div>
            </div>
            <Link to="/employee/salary" className="block pt-2">
              <Button variant="secondary" size="sm" className="w-full">
                Salary Ledger <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </Card>

          <Card className="p-5 space-y-3 hover:border-purple-400 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-md shadow-purple-500/30">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Shift Cash Drawer
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Opening float, expected drawer cash, and shift closing
                </p>
              </div>
            </div>
            <Link to="/employee/cash" className="block pt-2">
              <Button variant="outline" size="sm" className="w-full">
                Drawer Status <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </EmployeeLayout>
  );
};
export default EmployeeDashboard;
