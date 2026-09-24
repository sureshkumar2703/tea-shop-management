import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { dataService } from "@/services/supabaseService";
import { Profile } from "@/types";
import { formatDate } from "@/lib/utils";
import { Plus, ShieldCheck, Eye, EyeOff } from "lucide-react";

export const SuperAdminSuperAdminList: React.FC = () => {
  const navigate = useNavigate();
  const [superAdmins, setSuperAdmins] = useState<Profile[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const loadData = () => {
    dataService.getEmployees().then((users) => {
      // Filter ONLY Platform / Global Super Admins (no shop_id or role ADMIN with superadmin pattern or unassigned)
      const adminsOnly = users.filter(
        (u) => u.role === "ADMIN" && (!u.shop_id || u.email.includes("superadmin") || u.email.includes("admin"))
      );
      setSuperAdmins(adminsOnly);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    const isActive = newStatus === "ACTIVE";
    setUpdatingStatusId(userId);

    // Optimistically update local state
    setSuperAdmins((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_active: isActive } : u))
    );

    await dataService.updateUserStatus(userId, isActive);
    setUpdatingStatusId(null);
  };

  const columns = [
    {
      key: "full_name",
      header: "Administrator Name",
      render: (u: Profile) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white block">{u.full_name}</span>
          <span className="text-xs text-slate-400">{u.email}</span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Access Level",
      render: () => (
        <Badge variant="amber">
          Super Admin
        </Badge>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (u: Profile) => (
        <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
          {u.phone || "N/A"}
        </span>
      ),
    },
    {
      key: "location",
      header: "Location",
      render: (u: Profile) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {[u.district, u.state, u.country].filter(Boolean).join(", ") || "Headquarters"}
        </span>
      ),
    },
    {
      key: "password",
      header: "Password",
      render: (u: Profile) => {
        const isRevealed = visiblePasswords[u.id];
        const displayPass = u.password_hash || u.password || "••••••••";
        return (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 max-w-[120px] truncate">
              {isRevealed ? displayPass : "••••••••"}
            </span>
            <button
              type="button"
              onClick={() => togglePasswordVisibility(u.id)}
              className="p-1 rounded text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              title={isRevealed ? "Hide password" : "Show password"}
            >
              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        );
      },
    },
    {
      key: "created_at",
      header: "Created Date",
      render: (u: Profile) => (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
          {u.created_at ? formatDate(u.created_at) : "N/A"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (u: Profile) => {
        const isUpdating = updatingStatusId === u.id;
        return (
          <div className="flex items-center gap-2">
            <select
              value={u.is_active ? "ACTIVE" : "INACTIVE"}
              disabled={isUpdating}
              onChange={(e) => handleStatusChange(u.id, e.target.value)}
              className={`text-xs font-bold rounded-lg border px-2 py-1 transition-colors cursor-pointer ${
                u.is_active
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                  : "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800"
              }`}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>
        );
      },
    },
  ];

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-amber-500" />
              Super Administrators
            </h1>
            <p className="text-xs text-slate-500">
              Manage platform system administrators with enterprise-wide governance privileges
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate("/super-admin/super-admins/new")}
          >
            Create Super Admin
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={superAdmins}
          searchKey="full_name"
          searchPlaceholder="Search super admins by name or email..."
        />
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSuperAdminList;
