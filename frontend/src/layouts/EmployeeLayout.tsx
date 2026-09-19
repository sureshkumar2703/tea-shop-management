import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "@/components/common/Logo";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/stores/authStore";
import {
  LayoutDashboard,
  Receipt,
  Banknote,
  BarChart2,
  FileText,
  User,
  LogOut,
  Menu,
  X,
  Clock,
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export const EmployeeLayout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, shop, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clockedIn, setClockedIn] = useState(true);

  const navItems = [
    { label: "Dashboard", path: "/employee/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "POS Terminal", path: "/employee/billing", icon: <Receipt className="w-5 h-5" /> },
    { label: "Shift Cash", path: "/employee/cash", icon: <Banknote className="w-5 h-5" /> },
    { label: "Bills & Expenses", path: "/employee/reports", icon: <BarChart2 className="w-5 h-5" /> },
    { label: "My Salary Report", path: "/employee/salary", icon: <FileText className="w-5 h-5" /> },
    { label: "My Profile", path: "/employee/profile", icon: <User className="w-5 h-5" /> },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row">
      {/* Mobile Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <Logo size="sm" />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Barista Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <Logo size="md" />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {shop?.name || "Chai Craft"}
            </span>
            <Badge variant="info" size="sm">
              BARISTA
            </Badge>
          </div>

          {/* Clock In / Out Quick Pill */}
          <div className="mt-3">
            <button
              onClick={() => setClockedIn(!clockedIn)}
              className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                clockedIn
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-300/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-amber-50 text-amber-700 border border-amber-300/60 dark:bg-amber-950/40 dark:text-amber-300"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{clockedIn ? "Clocked In (Active Shift)" : "Clocked Out"}</span>
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                  isActive
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>


        {/* User Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {user?.full_name || "Pooja Verma"}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {user?.email || "cashier@chaicraft.in"}
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

      {/* Main Content Area */}
      <main className="flex-1 p-3 sm:p-5 max-w-7xl w-full mx-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};
