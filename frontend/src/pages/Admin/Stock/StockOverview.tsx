import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { dataService } from "@/services/supabaseService";
import { InventoryItem } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Package, AlertTriangle, Plus, RefreshCw, CheckCircle2 } from "lucide-react";

export const StockOverview: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  useEffect(() => {
    dataService.getInventory().then(setInventory);
  }, []);

  const handleOpenAdjust = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustQty(item.current_stock.toString());
    setAdjustModalOpen(true);
  };

  const handleSaveAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    const newStock = parseFloat(adjustQty);
    if (isNaN(newStock)) return;

    await dataService.updateStock(selectedItem.id, newStock);
    setInventory(inventory.map((i) => (i.id === selectedItem.id ? { ...i, current_stock: newStock } : i)));
    setAdjustModalOpen(false);
  };

  const columns = [
    {
      key: "name",
      header: "Raw Material",
      render: (i: InventoryItem) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white block">{i.name}</span>
          <span className="text-xs text-slate-400">
            {i.category} &bull; SKU: {i.sku || "N/A"}
          </span>
        </div>
      ),
    },
    {
      key: "current_stock",
      header: "Available Stock",
      render: (i: InventoryItem) => {
        const isLow = i.current_stock <= i.min_alert_threshold;
        return (
          <div className="space-y-0.5">
            <span className={`font-black text-sm ${isLow ? "text-rose-600" : "text-slate-900 dark:text-white"}`}>
              {i.current_stock} {i.unit}
            </span>
            {isLow && (
              <Badge variant="danger" size="sm" className="block w-fit">
                LOW STOCK
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "min_alert_threshold",
      header: "Reorder Trigger",
      render: (i: InventoryItem) => (
        <span className="text-xs text-slate-500 font-medium">
          &lt; {i.min_alert_threshold} {i.unit}
        </span>
      ),
    },
    {
      key: "cost_per_unit",
      header: "Unit Cost",
      render: (i: InventoryItem) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {formatCurrency(i.cost_per_unit)} / {i.unit}
        </span>
      ),
    },
    {
      key: "supplier_name",
      header: "Vendor",
      render: (i: InventoryItem) => <span className="text-xs text-slate-500">{i.supplier_name || "Local Mandi"}</span>,
    },
    {
      key: "actions",
      header: "Adjust",
      render: (i: InventoryItem) => (
        <Button size="sm" variant="outline" onClick={() => handleOpenAdjust(i)}>
          Update
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
              Kitchen Raw Materials & Inventory
            </h1>
            <p className="text-xs text-slate-500">
              Track milk, CTC tea leaves, cardamom spices, sugar, and earthen kulhads
            </p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={inventory}
          searchKey="name"
          searchPlaceholder="Search raw materials..."
        />
      </div>

      {selectedItem && (
        <Modal
          isOpen={adjustModalOpen}
          onClose={() => setAdjustModalOpen(false)}
          title={`Adjust Stock: ${selectedItem.name}`}
          size="sm"
        >
          <form onSubmit={handleSaveAdjust} className="space-y-4">
            <Input
              label={`Current Physical Stock Count (${selectedItem.unit})`}
              type="number"
              step="0.001"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              required
            />
            <Input
              label="Adjustment Reason / Notes"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="e.g. Physical audit count, kitchen spillage, or fresh batch"
            />
            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="secondary" onClick={() => setAdjustModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="flex-1">
                Save Stock
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
};
export default StockOverview;
