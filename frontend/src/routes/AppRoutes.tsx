import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleRoute } from "./RoleRoute";
import { useAuthStore } from "@/stores/authStore";
import { getDefaultDashboard } from "@/lib/permissions";

// Auth Pages
import Login from "@/pages/Auth/Login";
import ForgotPassword from "@/pages/Auth/ForgotPassword";
import ResetPassword from "@/pages/Auth/ResetPassword";
import CreateSuperAdmin from "@/pages/Auth/CreateSuperAdmin";

// Super Admin Pages
import SuperAdminDashboard from "@/pages/SuperAdmin/Dashboard";
import ShopList from "@/pages/SuperAdmin/Shops/ShopList";
import CreateShop from "@/pages/SuperAdmin/Shops/CreateShop";
import ShopDetails from "@/pages/SuperAdmin/Shops/ShopDetails";
import RenewShop from "@/pages/SuperAdmin/Shops/RenewShop";
import SuperAdminAdminList from "@/pages/SuperAdmin/Admins/AdminList";
import SuperAdminCreateAdmin from "@/pages/SuperAdmin/Admins/CreateAdmin";
import SuperAdminReports from "@/pages/SuperAdmin/Reports";
import SuperAdminSettings from "@/pages/SuperAdmin/Settings";

// Admin Pages
import AdminDashboard from "@/pages/Admin/Dashboard";
import BillingPOS from "@/pages/Admin/Billing/BillingPOS";
import OrderHistory from "@/pages/Admin/Billing/OrderHistory";
import CategoryList from "@/pages/Admin/Categories/CategoryList";
import ProductList from "@/pages/Admin/Products/ProductList";
import ProductForm from "@/pages/Admin/Products/ProductForm";
import StockOverview from "@/pages/Admin/Stock/StockOverview";
import StockAdjustment from "@/pages/Admin/Stock/StockAdjustment";
import PurchaseList from "@/pages/Admin/Purchases/PurchaseList";
import CreatePurchase from "@/pages/Admin/Purchases/CreatePurchase";
import SupplierList from "@/pages/Admin/Suppliers/SupplierList";
import ExpenseList from "@/pages/Admin/Expenses/ExpenseList";
import CreateExpense from "@/pages/Admin/Expenses/CreateExpense";
import CashRegister from "@/pages/Admin/Cash/CashRegister";
import EmployeeList from "@/pages/Admin/Employees/EmployeeList";
import CreateEmployee from "@/pages/Admin/Employees/CreateEmployee";
import AdminCreateAdmin from "@/pages/Admin/Admins/CreateAdmin";
import SalaryManagement from "@/pages/Admin/Salary/SalaryManagement";
import AttendanceManagement from "@/pages/Admin/Attendance/AttendanceManagement";
import ReportsDashboard from "@/pages/Admin/Reports/ReportsDashboard";
import AdminSettings from "@/pages/Admin/Settings";
import DatepayPage from "@/pages/Admin/Cash/Datepay";

// Employee Pages
import EmployeeDashboard from "@/pages/Employee/Dashboard";
import EmployeePOS from "@/pages/Employee/Billing/EmployeePOS";
import ShiftCash from "@/pages/Employee/Cash/ShiftCash";
import ShiftReports from "@/pages/Employee/Reports/ShiftReports";
import EmployeeSalaryReport from "@/pages/Employee/Salary/EmployeeSalaryReport";
import Profile from "@/pages/Employee/Profile";

export const AppRoutes: React.FC = () => {
  const { role, user } = useAuthStore();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/setup" element={<CreateSuperAdmin />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        {/* Super Admin Tier */}
        <Route element={<RoleRoute allowedRoles={["SUPER_ADMIN"]} />}>
          <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
          <Route path="/super-admin/shops" element={<ShopList />} />
          <Route path="/super-admin/shops/new" element={<CreateShop />} />
          <Route path="/super-admin/shops/:id" element={<ShopDetails />} />
          <Route path="/super-admin/shops/:id/renew" element={<RenewShop />} />
          <Route path="/super-admin/admins" element={<SuperAdminAdminList />} />
          <Route path="/super-admin/admins/new" element={<SuperAdminCreateAdmin />} />
          <Route path="/super-admin/reports" element={<SuperAdminReports />} />
          <Route path="/super-admin/settings" element={<SuperAdminSettings />} />
        </Route>

        {/* Admin / Shop Owner Tier */}
        <Route element={<RoleRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/billing" element={<BillingPOS />} />
          <Route path="/admin/billing/history" element={<OrderHistory />} />
          <Route path="/admin/categories" element={<CategoryList />} />
          <Route path="/admin/products" element={<ProductList />} />
          <Route path="/admin/products/new" element={<ProductForm />} />
          <Route path="/admin/stock" element={<StockOverview />} />
          <Route path="/admin/stock/adjust" element={<StockAdjustment />} />
          <Route path="/admin/purchases" element={<PurchaseList />} />
          <Route path="/admin/purchases/new" element={<CreatePurchase />} />
          <Route path="/admin/suppliers" element={<SupplierList />} />
          <Route path="/admin/expenses" element={<ExpenseList />} />
          <Route path="/admin/expenses/new" element={<CreateExpense />} />
          <Route path="/admin/cash" element={<CashRegister />} />
          <Route path="/admin/datepay" element={<DatepayPage />} />
          <Route path="/admin/employees" element={<EmployeeList />} />
          <Route path="/admin/employees/new" element={<CreateEmployee />} />
          <Route path="/admin/admins/new" element={<AdminCreateAdmin />} />
          <Route path="/admin/salary" element={<SalaryManagement />} />
          <Route path="/admin/attendance" element={<AttendanceManagement />} />
          <Route path="/admin/reports" element={<ReportsDashboard />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>

        {/* Employee / Barista Tier */}
        <Route element={<RoleRoute allowedRoles={["EMPLOYEE", "ADMIN", "SUPER_ADMIN"]} />}>
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
          <Route path="/employee/billing" element={<EmployeePOS />} />
          <Route path="/employee/cash" element={<ShiftCash />} />
          <Route path="/employee/reports" element={<ShiftReports />} />
          <Route path="/employee/salary" element={<EmployeeSalaryReport />} />
          <Route path="/employee/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Root & Catch-all redirection */}
      <Route
        path="/"
        element={
          user && role ? (
            <Navigate to={getDefaultDashboard(role)} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
export default AppRoutes;
