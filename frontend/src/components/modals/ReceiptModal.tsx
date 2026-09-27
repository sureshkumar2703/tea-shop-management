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
    const printContent = document.getElementById("printable-receipt");
    if (!printContent) {
      window.print();
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - ${order.order_number}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 3mm;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 4px;
              width: 100%;
              max-width: 76mm;
            }
            * {
              box-sizing: border-box;
            }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .border-b { border-bottom: 1px dashed #333; }
            .border-dashed { border-style: dashed; }
            .border-dotted { border-bottom: 1px dotted #888; }
            .flex { display: flex; justify-content: space-between; align-items: center; margin: 3px 0; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; margin: 4px 0; }
            th { border-bottom: 1px dashed #333; padding-bottom: 3px; font-size: 10px; text-transform: uppercase; }
            td { padding: 3px 0; vertical-align: top; }
            .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .text-left { text-align: left; }
            .text-emerald-600 { color: #000; }
            .text-slate-400, .text-slate-500 { color: #444; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }, 300);
    }
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
              <span className="font-semibold">{order.customer_name || "Walk-in Guest"}</span>
            </div>
            {order.customer_phone && (
              <div className="flex justify-between">
                <span>Phone:</span>
                <span className="font-semibold font-mono">{order.customer_phone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Type:</span>
              <span className="font-semibold uppercase">{order.order_type}</span>
            </div>
          </div>

          {/* Line items table with aligned columns & ellipsis */}
          <div className="py-3 border-b border-dashed border-slate-300 dark:border-slate-700">
            <table className="w-full text-[11px] border-collapse table-fixed">
              <thead>
                <tr className="text-slate-500 uppercase font-bold text-[10px] border-b border-dotted border-slate-200 dark:border-slate-700">
                  <th className="text-left pb-1 font-bold w-[45%]">Item</th>
                  <th className="text-center pb-1 font-bold w-[30%] whitespace-nowrap">Qty x Price</th>
                  <th className="text-right pb-1 font-bold w-[25%]">Amt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dotted divide-slate-100 dark:divide-slate-800">
                {order.items?.map((item, idx) => (
                  <tr key={idx} className="align-middle">
                    <td className="py-1.5 pr-1">
                      <span
                        className="font-medium text-slate-900 dark:text-white truncate block overflow-hidden text-ellipsis whitespace-nowrap"
                        title={item.product_name}
                      >
                        {item.product_name}
                      </span>
                      {item.addons && item.addons.length > 0 && (
                        <span className="text-[9px] text-slate-400 block truncate">
                          + {item.addons.map((a) => a.addon_name).join(", ")}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 px-1 text-center whitespace-nowrap font-mono text-slate-600 dark:text-slate-300">
                      {item.quantity} x {formatCurrency(item.unit_price)}
                    </td>
                    <td className="py-1.5 pl-1 text-right whitespace-nowrap font-bold text-slate-900 dark:text-white font-mono">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                {order.payment_method === "SPLIT" ? (
                  <div className="flex justify-between text-[10px] text-slate-500 pl-2">
                    <span>Split Details:</span>
                    <span className="font-semibold text-emerald-600">
                      Cash: {formatCurrency(order.cash_amount || 0)} | GPay: {formatCurrency(order.gpay_amount || 0)}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Received Amount:</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">
                        {formatCurrency(order.received_amount !== undefined ? order.received_amount : order.total_amount)}
                      </span>
                    </div>
                    {order.balance_amount !== undefined && order.balance_amount > 0 && (
                      <div className="flex justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                        <span>Change / Balance:</span>
                        <span className="font-mono">{formatCurrency(order.balance_amount)}</span>
                      </div>
                    )}
                  </>
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
