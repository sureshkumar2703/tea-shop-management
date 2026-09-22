import React, { useState, useEffect } from "react";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { dataService } from "@/services/supabaseService";
import { Shop } from "@/types";
import { formatDate } from "@/lib/utils";
import { Plus, Store, ExternalLink } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export const ShopList: React.FC = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);

  useEffect(() => {
    dataService.getShops().then(setShops);
  }, []);

  const columns = [
    {
      key: "name",
      header: "Shop Name",
      render: (shop: Shop) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white block">{shop.name}</span>
          <span className="text-xs text-slate-400">{shop.tagline || shop.slug}</span>
        </div>
      ),
    },
    {
      key: "address",
      header: "Location & Phone",
      render: (shop: Shop) => (
        <div className="text-xs">
          <p className="text-slate-700 dark:text-slate-300">{shop.address || "N/A"}</p>
          <p className="text-slate-400">{shop.phone || "No phone"}</p>
        </div>
      ),
    },
    {
      key: "subscription_status",
      header: "Status",
      render: (shop: Shop) => {
        const map: Record<string, "success" | "warning" | "danger"> = {
          ACTIVE: "success",
          TRIAL: "warning",
          EXPIRED: "danger",
        };
        return <Badge variant={map[shop.subscription_status] || "neutral"}>{shop.subscription_status}</Badge>;
      },
    },
    {
      key: "subscription_end_date",
      header: "Renewal Date",
      render: (shop: Shop) => <span className="text-xs font-medium">{formatDate(shop.subscription_end_date)}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (shop: Shop) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/super-admin/shops/${shop.id}`}
            className="p-1 text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            Details <ExternalLink className="w-3 h-3" />
          </Link>
          <Link
            to={`/super-admin/shops/${shop.id}/renew`}
            className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100"
          >
            Renew
          </Link>
        </div>
      ),
    },
  ];

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
              Shops & Franchises Registry
            </h1>
            <p className="text-xs text-slate-500">
              Manage multi-tenant tea house establishments and subscription terms
            </p>
          </div>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => navigate("/super-admin/shops/new")}>
            Provision Store
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={shops}
          searchKey="name"
          searchPlaceholder="Search by shop name..."
        />
      </div>

    </SuperAdminLayout>
  );
};
export default ShopList;
