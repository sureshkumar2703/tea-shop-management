import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CreateUserModal } from "@/components/modals/CreateUserModal";
import { dataService } from "@/services/supabaseService";
import { Profile } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Users, Coffee } from "lucide-react";

export const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    dataService.getEmployees().then(setEmployees);
  }, []);

  const columns = [
    {
      key: "full_name",
      header: "Staff Member",
      render: (u: Profile) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white block">{u.full_name}</span>
          <span className="text-xs text-slate-400">{u.email}</span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role / Station",
      render: (u: Profile) => (
        <Badge variant={u.role === "ADMIN" ? "amber" : "info"}>
          {u.role === "ADMIN" ? "Manager / Owner" : "Barista & Cashier"}
        </Badge>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (u: Profile) => <span className="text-xs text-slate-700 dark:text-slate-300">{u.phone || "N/A"}</span>,
    },
    {
      key: "monthly_salary",
      header: "Base Salary",
      render: (u: Profile) => (
        <span className="font-semibold text-xs text-slate-900 dark:text-white">
          {formatCurrency(u.monthly_salary || 0)} / mo
        </span>
      ),
    },
    {
      key: "joining_date",
      header: "Joined Date",
      render: (u: Profile) => <span className="text-xs text-slate-500">{formatDate(u.joining_date)}</span>,
    },
    {
      key: "is_active",
      header: "Status",
      render: (u: Profile) => <Badge variant={u.is_active ? "success" : "neutral"}>ACTIVE</Badge>,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
              Staff & Barista Roster
            </h1>
            <p className="text-xs text-slate-500">
              Manage tea masters, kitchen cooks, cashiers, and store attendants
            </p>
          </div>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setModalOpen(true)}>
            Onboard Staff
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={employees}
          searchKey="full_name"
          searchPlaceholder="Search staff by name..."
        />
      </div>

      <CreateUserModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultRole="EMPLOYEE"
        onSuccess={(newEmp) => setEmployees([newEmp, ...employees])}
      />
    </AdminLayout>
  );
};
export default EmployeeList;
