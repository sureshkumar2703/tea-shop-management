import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Purchase } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Truck } from "lucide-react";

export const PurchaseList: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([
    {
      id: "po-1",
      shop_id: "a1111111-1111-1111-1111-111111111111",
      invoice_number: "INV-ASM-8021",
      purchase_date: "2026-03-12",
      total_amount: 8400,
      paid_amount: 8400,
      payment_status: "PAID",
      payment_method: "UPI_QR",
      notes: "20kg Assam CTC Tea Leaves Bulk Bag",
      supplier: {
        id: "sup-1",
        shop_id: "a1111111-1111-1111-1111-111111111111",
        name: "Assam Direct Plantations Ltd",
        phone: "+91 94350 11223",
        is_active: true,
        created_at: "",
      },
      created_at: "2026-03-12T10:00:00Z",
    },
    {
      id: "po-2",
      shop_id: "a1111111-1111-1111-1111-111111111111",
      invoice_number: "INV-POT-4019",
      purchase_date: "2026-03-05",
      total_amount: 3500,
      paid_amount: 3500,
      payment_status: "PAID",
      payment_method: "CASH",
      notes: "1,000 pcs Handmade Terracotta Kulhads",
      supplier: {
        id: "sup-pot",
        shop_id: "a1111111-1111-1111-1111-111111111111",
        name: "Potters Cooperative Society",
        phone: "+91 98450 99887",
        is_active: true,
        created_at: "",
      },
      created_at: "2026-03-05T14:30:00Z",
    },
  ]);

  const columns = [
    {
      key: "invoice_number",
      header: "Invoice #",
      render: (p: Purchase) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white block">{p.invoice_number || "N/A"}</span>
          <span className="text-xs text-slate-400">{formatDate(p.purchase_date)}</span>
        </div>
      ),
    },
    {
      key: "supplier",
      header: "Vendor / Supplier",
      render: (p: Purchase) => (
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          {p.supplier?.name || "Local Supplier"}
        </span>
      ),
    },
    {
      key: "notes",
      header: "Supplies Description",
      render: (p: Purchase) => <span className="text-xs text-slate-500">{p.notes || "General supplies"}</span>,
    },
    {
      key: "total_amount",
      header: "Invoice Total",
      render: (p: Purchase) => (
        <span className="font-bold text-sm text-slate-900 dark:text-white">{formatCurrency(p.total_amount)}</span>
      ),
    },
    {
      key: "payment_status",
      header: "Status",
      render: (p: Purchase) => <Badge variant="success">{p.payment_status}</Badge>,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
              Inventory Inward Purchases
            </h1>
            <p className="text-xs text-slate-500">Track supplier shipments, bulk tea bags, and vendor billing</p>
          </div>
          <Link to="/admin/purchases/new">
            <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
              Record Purchase
            </Button>
          </Link>
        </div>

        <DataTable
          columns={columns}
          data={purchases}
          searchKey="invoice_number"
          searchPlaceholder="Search invoices..."
        />
      </div>
    </AdminLayout>
  );
};
export default PurchaseList;
