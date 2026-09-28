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
import { formatDate } from "@/lib/utils";
import { getPdfWatermarkCss, getPdfWatermarkHtml, getPdfHeaderHtml } from "@/lib/pdfUtils";
import {
  Plus,
  ShieldCheck,
  UserCheck,
  UserX,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building2,
  Crown,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

export const AdminList: React.FC = () => {
  const navigate = useNavigate();
  const { shop, user } = useAuthStore();
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const currentShopId = shop?.id || user?.shop_id;

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const data = await dataService.getEmployees(currentShopId);
      // Strictly filter to ensure only Owners and Admins belonging to the current shop are displayed
      let storeAdmins = data.filter(
        (u) =>
          (u.role === "OWNER" || u.role === "ADMIN") &&
          (!u.shop_id || u.shop_id === currentShopId)
      );

      // If current logged-in user is an owner/admin and not in list, include them
      if (user && (user.role === "OWNER" || user.role === "ADMIN")) {
        const exists = storeAdmins.some((a) => a.id === user.id || a.email === user.email);
        if (!exists) {
          storeAdmins = [
            {
              id: user.id,
              shop_id: currentShopId,
              full_name: user.full_name || "Shop Owner",
              email: user.email,
              phone: user.phone,
              role: user.role,
              is_active: user.is_active !== false,
              created_at: user.created_at || new Date().toISOString(),
              updated_at: user.updated_at || new Date().toISOString(),
            },
            ...storeAdmins,
          ];
        }
      }

      setAdmins(storeAdmins);
    } catch (err) {
      console.error("Failed to load admin list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, [currentShopId, user]);

  const handleStatusChange = async (adminId: string, newStatus: boolean) => {
    setUpdatingId(adminId);
    try {
      await dataService.updateUserStatus(adminId, newStatus);
      setAdmins((prev) =>
        prev.map((a) => (a.id === adminId ? { ...a, is_active: newStatus } : a))
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtered admin records
  const filteredAdmins = useMemo(() => {
    let list = [...admins];

    if (statusFilter === "ACTIVE") {
      list = list.filter((a) => a.is_active !== false);
    } else if (statusFilter === "INACTIVE") {
      list = list.filter((a) => a.is_active === false);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((a) => {
        const nameMatch = a.full_name?.toLowerCase().includes(q);
        const emailMatch = a.email?.toLowerCase().includes(q);
        const phoneMatch = a.phone?.includes(q);
        const roleMatch = a.role?.toLowerCase().includes(q);
        const locMatch = `${a.district || ""} ${a.state || ""} ${a.country || ""}`.toLowerCase().includes(q);
        return nameMatch || emailMatch || phoneMatch || roleMatch || locMatch;
      });
    }

    return list;
  }, [admins, statusFilter, searchTerm]);

  const totalAdmins = admins.length;
  const activeCount = admins.filter((a) => a.is_active !== false).length;
  const inactiveCount = admins.filter((a) => a.is_active === false).length;
  const ownerCount = admins.filter((a) => a.role === "OWNER").length;

  const columns = [
    {
      key: "full_name",
      header: "Owner / Co-Admin",
      render: (u: Profile) => (
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-sm uppercase shadow-sm ${
              u.role === "OWNER"
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                : "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30"
            }`}
          >
            {u.role === "OWNER" ? (
              <Crown className="w-5 h-5 text-amber-500" />
            ) : (
              u.full_name?.charAt(0) || "A"
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white block text-sm">
                {u.full_name}
              </span>
              {u.id === user?.id && (
                <span className="text-[10px] font-extrabold bg-amber-500/20 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded">
                  YOU
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-400" />
              {u.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role & Access",
      render: (u: Profile) => (
        <div>
          <Badge variant={u.role === "OWNER" ? "warning" : "info"}>
            {u.role === "OWNER" ? "Shop Owner" : "Co-Admin"}
          </Badge>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {u.role === "OWNER" ? "Full Store Control" : "Store Management"}
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone Number",
      render: (u: Profile) => (
        <div className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-mono">
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
      key: "created_at",
      header: "Registered Date",
      render: (u: Profile) => (
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {formatDate(u.created_at)}
        </span>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      render: (u: Profile) => {
        const isActive = u.is_active !== false;
        const isSelf = u.id === user?.id;

        return (
          <select
            value={isActive ? "active" : "inactive"}
            onChange={(e) => handleStatusChange(u.id, e.target.value === "active")}
            disabled={updatingId === u.id || isSelf}
            title={isSelf ? "You cannot disable your own active account" : "Toggle account status"}
            className={`text-xs font-bold rounded-lg px-2.5 py-1 border transition-colors outline-none cursor-pointer ${
              isActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
            } ${isSelf ? "opacity-75 cursor-not-allowed" : ""}`}
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
    if (filteredAdmins.length === 0) {
      alert("No administrator records to export.");
      return;
    }

    const headers = [
      "Owner / Admin Name",
      "Email Address",
      "Role",
      "Access Level",
      "Phone Number",
      "District",
      "State",
      "Country",
      "Registered Date",
      "Status",
    ];

    const rows = filteredAdmins.map((a) => [
      `"${a.full_name || ''}"`,
      `"${a.email || ''}"`,
      `"${a.role}"`,
      `"${a.role === 'OWNER' ? 'Shop Owner' : 'Co-Admin'}"`,
      `"${a.phone || '-'}"`,
      `"${a.district || '-'}"`,
      `"${a.state || '-'}"`,
      `"${a.country || 'India'}"`,
      `"${formatDate(a.created_at)}"`,
      `"${a.is_active !== false ? 'ACTIVE' : 'INACTIVE'}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const shopSlug = (shop?.name || "Store").replace(/[^a-zA-Z0-9_-]/g, "_");
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `Admin_List_${shopSlug}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (filteredAdmins.length === 0) {
      alert("No administrator records to export.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const shopName = shop?.name || "Tea Shop";
    const shopAddress = shop?.address || "";

    const rowsHtml = filteredAdmins
      .map(
        (a) => `
        <tr>
          <td><strong>${a.full_name}</strong><br><small style="color: #64748b;">${a.email}</small></td>
          <td><span class="badge ${a.role === 'OWNER' ? 'owner' : 'admin'}">${a.role === 'OWNER' ? 'Shop Owner' : 'Co-Admin'}</span></td>
          <td>${a.phone || '-'}</td>
          <td>${[a.district, a.state, a.country].filter(Boolean).join(", ") || '-'}</td>
          <td>${formatDate(a.created_at)}</td>
          <td><span class="badge ${a.is_active !== false ? 'active' : 'inactive'}">${a.is_active !== false ? 'ACTIVE' : 'INACTIVE'}</span></td>
        </tr>
      `
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Owners & Co-Admins - ${shopName}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1e293b; position: relative; }
          .shop-title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
          .shop-meta { font-size: 11px; color: #64748b; margin-top: 2px; }
          .report-badge { background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 12px; display: inline-block; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .stat-box { background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; }
          .stat-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
          .stat-val { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
          th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; }
          td { border: 1px solid #e2e8f0; padding: 8px 10px; }
          tr:nth-child(even) { background: #f8fafc; }
          .badge { padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
          .badge.owner { background: #fef3c7; color: #92400e; }
          .badge.admin { background: #e0f2fe; color: #0369a1; }
          .badge.active { background: #dcfce7; color: #166534; }
          .badge.inactive { background: #fee2e2; color: #991b1b; }
          .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          ${getPdfWatermarkCss()}
          @media print { body { padding: 0; } @page { size: landscape; margin: 12mm; } }
        </style>
      </head>
      <body>
        ${getPdfWatermarkHtml(shopName, shop?.logo_url)}
        ${getPdfHeaderHtml(shopName, shopAddress, "SHOP OWNERS & CO-ADMINS DIRECTORY", shop?.logo_url)}

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-label">Total Admins</div>
            <div class="stat-val">${totalAdmins}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Primary Owners</div>
            <div class="stat-val" style="color: #b45309;">${ownerCount}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label" style="color: #166534;">Active Accounts</div>
            <div class="stat-val" style="color: #166534;">${activeCount}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label" style="color: #991b1b;">Inactive Accounts</div>
            <div class="stat-val" style="color: #991b1b;">${inactiveCount}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Owner / Co-Admin</th>
              <th>Role & Access</th>
              <th>Phone Number</th>
              <th>Location</th>
              <th>Registered Date</th>
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
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-amber-500" />
              Shop Owners & Co-Admins
            </h1>
            <p className="text-xs text-slate-500">
              Manage owners, partners, and co-administrators for{" "}
              <strong className="text-slate-800 dark:text-slate-200">{shop?.name || "this store"}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              onClick={handleExportExcel}
              disabled={filteredAdmins.length === 0}
            >
              Download Excel (.csv)
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
              onClick={handleExportPDF}
              disabled={filteredAdmins.length === 0}
            >
              Download PDF
            </Button>
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => navigate("/admin/admins/new")}
            >
              Add Co-Owner
            </Button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Admins</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{totalAdmins}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Primary Owners</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{ownerCount}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Active Accounts</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {activeCount}
              </p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="p-3 bg-rose-500/10 rounded-xl text-rose-600 dark:text-rose-400">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Inactive Accounts</p>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{inactiveCount}</p>
            </div>
          </Card>
        </div>

        {/* Filter & Search Bar */}
        <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search owner/admin by name, email, phone, location..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Status ({totalAdmins})</option>
              <option value="ACTIVE">Active Only ({activeCount})</option>
              <option value="INACTIVE">Inactive Only ({inactiveCount})</option>
            </select>
          </div>
        </Card>

        {/* Table View */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Registered Shop Owners & Co-Admins ({filteredAdmins.length})
            </h2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Loading administrator accounts...
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <ShieldCheck className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
              <p>No admin accounts found matching your filter.</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredAdmins}
              pageSize={10}
              emptyTitle="No administrator accounts found"
              emptyDescription="No owners or co-admins match the selected filters."
            />
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminList;
