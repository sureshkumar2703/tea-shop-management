import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { DataTable } from "@/components/tables/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ReceiptModal } from "@/components/modals/ReceiptModal";
import { dataService } from "@/services/supabaseService";
import { Order } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Printer, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export const OrderHistory: React.FC = () => {
  const { shop } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  useEffect(() => {
    dataService.getOrders().then(setOrders);
  }, []);

  const handlePrint = (order: Order) => {
    setSelectedOrder(order);
    setReceiptOpen(true);
  };

  const columns = [
    {
      key: "order_number",
      header: "Ticket #",
      render: (o: Order) => <span className="font-bold text-slate-900 dark:text-white">{o.order_number}</span>,
    },
    {
      key: "created_at",
      header: "Time",
      render: (o: Order) => <span className="text-xs text-slate-500">{formatDateTime(o.created_at)}</span>,
    },
    {
      key: "customer_name",
      header: "Customer",
      render: (o: Order) => (
        <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
          {o.customer_name || "Walk-in Guest"}
        </span>
      ),
    },
    {
      key: "payment_method",
      header: "Payment",
      render: (o: Order) => <Badge variant="neutral">{o.payment_method}</Badge>,
    },
    {
      key: "total_amount",
      header: "Total",
      render: (o: Order) => (
        <span className="font-bold text-amber-600 dark:text-amber-400">{formatCurrency(o.total_amount)}</span>
      ),
    },
    {
      key: "actions",
      header: "Receipt",
      render: (o: Order) => (
        <Button size="sm" variant="outline" icon={<Printer className="w-3.5 h-3.5" />} onClick={() => handlePrint(o)}>
          Print
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
              Billing & Order History
            </h1>
            <p className="text-xs text-slate-500">View processed tickets and reprint tax invoices</p>
          </div>
          <Link to="/admin/billing">
            <Button variant="primary">Back to POS Terminal</Button>
          </Link>
        </div>

        <DataTable
          columns={columns}
          data={orders}
          searchKey="order_number"
          searchPlaceholder="Search by order number (e.g. CC-4091)..."
        />
      </div>

      <ReceiptModal
        isOpen={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        order={selectedOrder}
        shop={shop}
      />
    </AdminLayout>
  );
};
export default OrderHistory;
