import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "@/components/common/Logo";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/stores/authStore";
import {
  LayoutDashboard,
  Store,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export const SuperAdminLayout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: "Overview", path: "/super-admin/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: "Shops & Franchises", path: "/super-admin/shops", icon: <Store className="w-4 h-4" /> },
    { label: "Create New Shop", path: "/super-admin/shops/new", icon: <Store className="w-4 h-4" /> },
    { label: "Shop Admins", path: "/super-admin/admins", icon: <Users className="w-4 h-4" /> },
    { label: "Platform Reports", path: "/super-admin/reports", icon: <BarChart3 className="w-4 h-4" /> },
    { label: "System Settings", path: "/super-admin/settings", icon: <Settings className="w-4 h-4" /> },
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
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <Logo size="md" showTagline />
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="amber" size="sm" className="gap-1">
              <ShieldCheck className="w-3 h-3" />
              SUPER ADMIN
            </Badge>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
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
        </nav>


        {/* User Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {user?.full_name || "Super Admin"}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {user?.email || "superadmin@admin.com"}
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
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};
