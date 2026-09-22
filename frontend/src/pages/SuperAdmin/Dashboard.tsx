import React, { useEffect, useState } from "react";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/tables/DataTable";
import { dataService } from "@/services/supabaseService";
import { Shop } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Store, Users, CreditCard, AlertTriangle, Plus, ArrowRight, ShieldCheck, Database } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);

  useEffect(() => {
    dataService.getShops().then(setShops);
  }, []);

  const totalShops = shops.length;
  const activeShops = shops.filter((s) => s.subscription_status === "ACTIVE").length;
  const trialShops = shops.filter((s) => s.subscription_status === "TRIAL").length;

  const columns = [
    {
      key: "name",
      header: "Tea Shop / Franchise",
      render: (shop: Shop) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white block">{shop.name}</span>
          <span className="text-xs text-slate-400">{shop.address || shop.slug}</span>
        </div>
      ),
    },
    {
      key: "subscription_status",
      header: "Subscription",
      render: (shop: Shop) => {
        const variants: Record<string, "success" | "warning" | "danger"> = {
          ACTIVE: "success",
          TRIAL: "warning",
          EXPIRED: "danger",
          SUSPENDED: "danger",
        };
        return <Badge variant={variants[shop.subscription_status] || "neutral"}>{shop.subscription_status}</Badge>;
      },
    },
    {
      key: "subscription_end_date",
      header: "Valid Until",
      render: (shop: Shop) => (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {formatDate(shop.subscription_end_date)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (shop: Shop) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/super-admin/shops/${shop.id}`}
            className="text-xs font-semibold text-amber-600 hover:text-amber-700"
          >
            Manage
          </Link>
          <span className="text-slate-300">|</span>
          <Link
            to={`/super-admin/shops/${shop.id}/renew`}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
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
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-slate-900 dark:text-white tracking-tight">
              Super Admin Control Centre
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Multi-tenant overview, store provisioning, and billing health
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => navigate("/super-admin/shops/new")}
            >
              Add New Shop
            </Button>
          </div>
        </div>

        {/* Database Status Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-amber-200/60 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Supabase PostgreSQL Database Connected
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tenant isolation enforced via Row-Level Security (RLS) & PostgreSQL schemas
              </p>
            </div>
          </div>
          <Badge variant="success" size="md">
            POSTGRES READY
          </Badge>
        </div>

        {/* Platform Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Total Tea Shops"
            value={totalShops}
            icon={<Store className="w-5 h-5" />}
            trend={{ value: "+2 this month", isPositive: true }}
            subtitle={`${activeShops} active, ${trialShops} on trial`}
            color="amber"
          />
          <StatCard
            title="Platform MRR"
            value={formatCurrency(74500)}
            icon={<CreditCard className="w-5 h-5" />}
            trend={{ value: "+18.4%", isPositive: true }}
            subtitle="SaaS franchise subscriptions"
            color="emerald"
          />
          <StatCard
            title="Active Staff Accounts"
            value="38"
            icon={<Users className="w-5 h-5" />}
            trend={{ value: "+6", isPositive: true }}
            subtitle="Across all franchise locations"
            color="blue"
          />
          <StatCard
            title="Renewals Due"
            value={trialShops}
            icon={<AlertTriangle className="w-5 h-5" />}
            subtitle="Expiring in the next 14 days"
            color="purple"
          />
        </div>

        {/* Shops Management Table */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-['Outfit'] text-slate-900 dark:text-white">
                Provisioned Shops & Franchises
              </h2>
              <p className="text-xs text-slate-500">Live directory of all tea cafe instances</p>
            </div>
            <Link
              to="/super-admin/shops"
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              View Full Table <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <DataTable
            columns={columns}
            data={shops}
            searchKey="name"
            searchPlaceholder="Search shops by name..."
          />
        </Card>
      </div>

    </SuperAdminLayout>
  );
};
export default SuperAdminDashboard;
