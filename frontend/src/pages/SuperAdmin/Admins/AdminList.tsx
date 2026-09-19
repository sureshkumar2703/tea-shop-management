import React, { useState, useEffect } from "react";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CreateUserModal } from "@/components/modals/CreateUserModal";
import { dataService } from "@/services/supabaseService";
import { Profile, Shop } from "@/types";
import { Plus, Users, Mail, Phone, Store } from "lucide-react";

export const SuperAdminAdminList: React.FC = () => {
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    dataService.getEmployees().then((users) => {
      setAdmins(users.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN"));
    });
    dataService.getShops().then(setShops);
  }, []);

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
      render: (u: Profile) => (
        <Badge variant={u.role === "SUPER_ADMIN" ? "amber" : "info"}>
          {u.role.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (u: Profile) => <span className="text-xs text-slate-600 dark:text-slate-300">{u.phone || "N/A"}</span>,
    },
    {
      key: "is_active",
      header: "Status",
      render: (u: Profile) => (
        <Badge variant={u.is_active ? "success" : "danger"}>
          {u.is_active ? "ACTIVE" : "INACTIVE"}
        </Badge>
      ),
    },
  ];

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
              Franchise & Store Administrators
            </h1>
            <p className="text-xs text-slate-500">
              Manage store owners, managers, and system administrators
            </p>
          </div>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setModalOpen(true)}>
            Onboard Admin
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={admins}
          searchKey="full_name"
          searchPlaceholder="Search admins by name..."
        />
      </div>

      <CreateUserModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultRole="ADMIN"
        shops={shops}
        onSuccess={(newUser) => setAdmins([newUser, ...admins])}
      />
    </SuperAdminLayout>
  );
};
export default SuperAdminAdminList;
