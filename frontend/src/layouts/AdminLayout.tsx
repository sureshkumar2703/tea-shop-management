import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "@/components/common/Logo";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/stores/authStore";
import {
  LayoutDashboard,
  Receipt,
  Coffee,
  Package,
  Boxes,
  Truck,
  DollarSign,
  Banknote,
  TrendingUp,
  UserPlus,
  Users,
  CalendarCheck,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, shop, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navSections = [
    {
      title: "Core Operations",
      items: [
        { label: "Dashboard", path: "/admin/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: "POS Billing", path: "/admin/billing", icon: <Receipt className="w-4 h-4" /> },
        { label: "Datepay & Tally", path: "/admin/datepay", icon: <TrendingUp className="w-4 h-4" /> },
        { label: "Cash Drawer", path: "/admin/cash", icon: <Banknote className="w-4 h-4" /> },
      ],
    },
    {
      title: "Menu & Inventory",
      items: [
        { label: "Categories", path: "/admin/categories", icon: <Boxes className="w-4 h-4" /> },
        { label: "Products Catalog", path: "/admin/products", icon: <Coffee className="w-4 h-4" /> },
        { label: "Stock & Inventory", path: "/admin/stock", icon: <Package className="w-4 h-4" /> },
        { label: "Purchases", path: "/admin/purchases", icon: <Truck className="w-4 h-4" /> },
        { label: "Suppliers", path: "/admin/suppliers", icon: <Store className="w-4 h-4" /> },
      ],
    },
    {
      title: "Finance & Team",
      items: [
        { label: "Daily Expenses", path: "/admin/expenses", icon: <DollarSign className="w-4 h-4" /> },
        { label: "Staff Roster", path: "/admin/employees", icon: <Users className="w-4 h-4" /> },
        { label: "Add Co-Admin", path: "/admin/admins/new", icon: <UserPlus className="w-4 h-4" /> },
        { label: "Attendance", path: "/admin/attendance", icon: <CalendarCheck className="w-4 h-4" /> },
        { label: "Payroll & Salary", path: "/admin/salary", icon: <Banknote className="w-4 h-4" /> },
      ],
    },
    {
      title: "Intelligence",
      items: [
        { label: "Reports & P&L", path: "/admin/reports", icon: <BarChart2 className="w-4 h-4" /> },
        { label: "Shop Settings", path: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
      ],
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <Logo size="sm" />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <Logo size="md" showTagline />
          <div className="mt-3 flex items-center justify-between">
            <div className="truncate">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                {shop?.name || "Chai Craft Artisan Bar"}
              </span>
              <span className="text-[10px] text-slate-400">Store Admin</span>
            </div>
            <Badge variant="success" size="sm">
              ACTIVE
            </Badge>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {section.title}
              </p>
              {section.items.map((item) => {
                const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>


        {/* User Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {user?.full_name || "Aarav Sharma"}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {user?.email || "owner@chaicraft.com"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};
