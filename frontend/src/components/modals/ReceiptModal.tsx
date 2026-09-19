import React from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Order, Shop } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Printer, CheckCircle } from "lucide-react";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  shop: Shop | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  order,
  shop,
}) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tax Invoice & Receipt"
      description={`Order ${order.order_number}`}
      size="sm"
    >
      <div className="space-y-6">
        {/* Printable thermal receipt view */}
        <div
          id="printable-receipt"
          className="p-5 rounded-2xl bg-amber-50/40 dark:bg-slate-950 border border-dashed border-amber-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200"
        >
          {/* Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
            <h4 className="text-base font-bold tracking-tight font-sans text-slate-900 dark:text-white">
              {shop?.name || "Chai Craft Artisan Bar"}
            </h4>
            <p className="text-[11px] text-slate-500">{shop?.address || "Brigade Road, Bangalore"}</p>
            {shop?.gst_number && (
              <p className="text-[10px] text-slate-400 mt-0.5">GSTIN: {shop.gst_number}</p>
            )}
            <p className="text-[10px] text-slate-400">
              Tel: {shop?.phone || "+91 98765 43210"} {shop?.shop_code ? `• Shop Code: ${shop.shop_code}` : ""}
            </p>
          </div>

          {/* Metadata */}
          <div className="py-2.5 border-b border-dashed border-slate-300 dark:border-slate-700 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span>Order #:</span>
              <span className="font-bold">{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{formatDateTime(order.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{order.customer_name || "Walk-in Guest"}</span>
            </div>
            <div className="flex justify-between">
              <span>Type:</span>
              <span className="font-semibold uppercase">{order.order_type}</span>
            </div>
          </div>

          {/* Line items */}
          <div className="py-3 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-2">
            <div className="flex justify-between font-bold text-[11px] uppercase text-slate-500">
              <span>Item</span>
              <span>Qty x Price</span>
              <span>Amt</span>
            </div>
            {order.items?.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span className="font-medium text-slate-900 dark:text-white">
                    {item.product_name} {item.variant_name ? `(${item.variant_name})` : ""}
                    {item.size_variant ? ` [${item.size_variant}]` : ""}
                    {item.weight_grams ? ` (${item.weight_grams}g)` : ""}
                  </span>
                  <span>
                    {item.quantity} x {formatCurrency(item.unit_price)}
                  </span>
                  <span className="font-semibold">{formatCurrency(item.subtotal)}</span>
                </div>
                {item.addons && item.addons.length > 0 && (
                  <div className="pl-2 text-[10px] text-slate-500">
                    + {item.addons.map((a) => `${a.addon_name} (${formatCurrency(a.price)})`).join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Calculations */}
          <div className="py-2.5 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span>-{formatCurrency(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>GST ({order.tax_rate}%):</span>
              <span>{formatCurrency(order.tax_amount)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1">
              <span>Grand Total:</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
            <div className="pt-2 border-t border-dotted border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {order.payment_method === "SPLIT"
                    ? "Both (Cash + GPay)"
                    : order.payment_method === "UPI_QR"
                    ? "Google Pay / UPI"
                    : "Cash Tender"}
                </span>
              </div>
              {order.payment_method === "SPLIT" && (
                <div className="flex justify-between text-[10px] text-slate-500 pl-2">
                  <span>Split Details:</span>
                  <span className="font-semibold text-emerald-600">
                    Cash: {formatCurrency(order.cash_amount || 0)} | GPay: {formatCurrency(order.gpay_amount || 0)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-3 text-center text-[10px] text-slate-500 space-y-1">
            <p className="font-medium">{shop?.receipt_footer || "Thank you for visiting! Have a refreshing day."}</p>
            <p className="text-[9px] text-slate-400">Powered by ChaiCraft Enterprise POS</p>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handlePrint}
            icon={<Printer className="w-4 h-4" />}
            className="flex-1"
          >
            Print Receipt
          </Button>
        </div>
      </div>
    </Modal>
  );
};
