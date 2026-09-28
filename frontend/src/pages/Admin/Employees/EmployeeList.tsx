import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { DataTable } from "@/components/tables/DataTable";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { dataService } from "@/services/supabaseService";
import { useAuthStore } from "@/stores/authStore";
import { Profile } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getPdfWatermarkCss, getPdfWatermarkHtml, getPdfHeaderHtml } from "@/lib/pdfUtils";
import {
  Plus,
  Users,
  UserCheck,
  UserX,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building2,
  Coffee,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

export const EmployeeList: React.FC = () => {
  const navigate = useNavigate();
  const { shop, user } = useAuthStore();
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const currentShopId = shop?.id || user?.shop_id;

  const loadEmployees = async () => {
    if (currentShopId) {
      const data = await dataService.getEmployees(currentShopId);
      // Strictly filter to ensure only employees belonging to the current logged-in shop are displayed
      const storeEmployees = data.filter(
        (e) => e.role === "EMPLOYEE" && e.shop_id === currentShopId
      );
      setEmployees(storeEmployees);
    } else {
      const data = await dataService.getEmployees();
      const storeEmployees = data.filter((e) => e.role === "EMPLOYEE");
      setEmployees(storeEmployees);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [currentShopId]);

  const handleStatusChange = async (employeeId: string, newStatus: boolean) => {
    setUpdatingId(employeeId);
    try {
      await dataService.updateUserStatus(employeeId, newStatus);
      setEmployees((prev) =>
        prev.map((e) => (e.id === employeeId ? { ...e, is_active: newStatus } : e))
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const totalEmployees = employees.length;
  const activeCount = employees.filter((e) => e.is_active !== false).length;
  const inactiveCount = employees.filter((e) => e.is_active === false).length;

  const columns = [
    {
      key: "full_name",
      header: "Employee / Barista",
      render: (u: Profile) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-sm uppercase">
            {u.full_name?.charAt(0) || "E"}
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white block text-sm">
              {u.full_name}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-400" />
              {u.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone Number",
      render: (u: Profile) => (
        <div className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          <span>{u.phone || "N/A"}</span>
        </div>
      ),
    },
    {
      key: "location",
      header: "District & State",
      render: (u: Profile) => {
        const loc = [u.district, u.state, u.country].filter(Boolean).join(", ");
        return (
          <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate max-w-[180px]">{loc || u.address || "India"}</span>
          </div>
        );
      },
    },
    {
      key: "monthly_salary",
      header: "Monthly Salary",
      render: (u: Profile) => (
        <span className="font-semibold text-xs text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
          {formatCurrency(u.monthly_salary || 0)} / mo
        </span>
      ),
    },
    {
      key: "joining_date",
      header: "Joined Date",
      render: (u: Profile) => (
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {formatDate(u.joining_date || u.created_at)}
        </span>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      render: (u: Profile) => {
        const isActive = u.is_active !== false;
        return (
          <select
            value={isActive ? "active" : "inactive"}
            onChange={(e) => handleStatusChange(u.id, e.target.value === "active")}
            disabled={updatingId === u.id}
            className={`text-xs font-bold rounded-lg px-2.5 py-1 border transition-colors outline-none cursor-pointer ${
              isActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
            }`}
          >
            <option value="active">ACTIVE</option>
            <option value="inactive">INACTIVE</option>
          </select>
        );
      },
    },
  ];

  // Export to Excel (.csv)
  const handleExportExcel = () => {
    if (employees.length === 0) {
      alert("No employee records to export.");
      return;
    }

    const headers = [
      "Employee Name",
      "Email Address",
      "Phone Number",
      "District",
      "State",
      "Country",
      "Monthly Salary (INR)",
      "Joined Date",
      "Status",
    ];

    const rows = employees.map((e) => [
      `"${e.full_name || ''}"`,
      `"${e.email || ''}"`,
      `"${e.phone || '-'}"`,
      `"${e.district || '-'}"`,
      `"${e.state || '-'}"`,
      `"${e.country || 'India'}"`,
      e.monthly_salary || 0,
      `"${formatDate(e.joining_date || e.created_at)}"`,
      `"${e.is_active !== false ? 'ACTIVE' : 'INACTIVE'}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const shopSlug = (shop?.name || "Store").replace(/[^a-zA-Z0-9_-]/g, "_");
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `Employee_List_${shopSlug}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (employees.length === 0) {
      alert("No employee records to export.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const shopName = shop?.name || "Tea Shop";
    const shopAddress = shop?.address || "";

    const rowsHtml = employees
      .map(
        (e) => `
        <tr>
          <td><strong>${e.full_name}</strong><br><small style="color: #64748b;">${e.email}</small></td>
          <td>${e.phone || '-'}</td>
          <td>${[e.district, e.state, e.country].filter(Boolean).join(", ") || '-'}</td>
          <td style="text-align: right; font-weight: 600;">₹${Number(e.monthly_salary || 0).toLocaleString()}</td>
          <td>${formatDate(e.joining_date || e.created_at)}</td>
          <td><span class="badge ${e.is_active !== false ? 'active' : 'inactive'}">${e.is_active !== false ? 'ACTIVE' : 'INACTIVE'}</span></td>
        </tr>
      `
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Employee Directory - ${shopName}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1e293b; position: relative; }
          .shop-title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
          .shop-meta { font-size: 11px; color: #64748b; margin-top: 2px; }
          .report-badge { background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 12px; display: inline-block; }
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
          .stat-box { background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; }
          .stat-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
          .stat-val { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
          th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; }
          td { border: 1px solid #e2e8f0; padding: 8px 10px; }
          tr:nth-child(even) { background: #f8fafc; }
          .badge { padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
          .badge.active { background: #dcfce7; color: #166534; }
          .badge.inactive { background: #fee2e2; color: #991b1b; }
          .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          ${getPdfWatermarkCss()}
          @media print { body { padding: 0; } @page { size: landscape; margin: 12mm; } }
        </style>
      </head>
      <body>
        ${getPdfWatermarkHtml(shopName, shop?.logo_url)}
        ${getPdfHeaderHtml(shopName, shopAddress, "STAFF & EMPLOYEE DIRECTORY", shop?.logo_url)}

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-label">Total Employees</div>
            <div class="stat-val">${totalEmployees}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label" style="color: #166534;">Active Staff</div>
            <div class="stat-val" style="color: #166534;">${activeCount}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label" style="color: #991b1b;">Inactive / On Leave</div>
            <div class="stat-val" style="color: #991b1b;">${inactiveCount}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Employee / Barista</th>
              <th>Phone Number</th>
              <th>Location</th>
              <th style="text-align: right;">Monthly Salary</th>
              <th>Joined Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">Report generated from ${shopName} Management System.</div>
        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-amber-500" />
              Employee List
            </h1>
            <p className="text-xs text-slate-500">
              Active employees and baristas for store:{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                {shop?.name || "Your Store"}
              </strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              onClick={handleExportExcel}
              disabled={employees.length === 0}
            >
              Download Excel (.csv)
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
              onClick={handleExportPDF}
              disabled={employees.length === 0}
            >
              Download PDF
            </Button>
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => navigate("/admin/employees/new")}
            >
              Add Employee
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Total Employees</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {totalEmployees}
              </span>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600 dark:text-amber-400">
              <Users className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Active Employees</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {activeCount}
              </span>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Inactive / On Leave</span>
              <span className="text-2xl font-black text-rose-500">{inactiveCount}</span>
            </div>
            <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500">
              <UserX className="w-5 h-5" />
            </div>
          </Card>
        </div>

        {/* Employee Table */}
        <Card className="p-0 overflow-hidden">
          <DataTable
            columns={columns}
            data={employees}
            searchKey="full_name"
            searchPlaceholder="Search employees by name, phone, or email..."
          />
        </Card>
      </div>
    </AdminLayout>
  );
};

export default EmployeeList;
