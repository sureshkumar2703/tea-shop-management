import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { dataService } from "@/services/supabaseService";
import { InventoryItem } from "@/types";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const StockAdjustment: React.FC = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [type, setType] = useState<"ADD" | "SUBTRACT">("ADD");
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    dataService.getInventory().then((res) => {
      setInventory(res);
      if (res[0]) setSelectedId(res[0].id);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = inventory.find((i) => i.id === selectedId);
    if (!item) return;

    const diff = parseFloat(quantity) || 0;
    const newTotal = type === "ADD" ? item.current_stock + diff : Math.max(0, item.current_stock - diff);

    await dataService.updateStock(item.id, newTotal);
    setSuccess(true);
    setTimeout(() => {
      navigate("/admin/stock");
    }, 1200);
  };

  return (
    <AdminLayout>
      <div className="max-w-xl mx-auto space-y-6">
        <button
          onClick={() => navigate("/admin/stock")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Inventory
        </button>

        <div>
          <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
            Log Stock Adjustment / Wastage
          </h1>
          <p className="text-xs text-slate-500">Record kitchen spillage, milk spoilage, or manual inventory counts</p>
        </div>

        {success ? (
          <Card className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <p className="font-bold text-slate-900 dark:text-white">Stock Level Updated!</p>
          </Card>
        ) : (
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Raw Ingredient
                </label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100"
                >
                  {inventory.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Current: {i.current_stock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType("ADD")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                    type === "ADD"
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/40"
                      : "border-slate-200 text-slate-600 dark:border-slate-700"
                  }`}
                >
                  + Add Restock
                </button>
                <button
                  type="button"
                  onClick={() => setType("SUBTRACT")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                    type === "SUBTRACT"
                      ? "bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/40"
                      : "border-slate-200 text-slate-600 dark:border-slate-700"
                  }`}
                >
                  - Wastage / Spoilage
                </button>
              </div>

              <Input
                label="Adjustment Quantity"
                type="number"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="5"
                required
              />

              <Input
                label="Reason / Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Broken kulhads in shipment, or spoiled milk"
              />

              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="secondary" onClick={() => navigate("/admin/stock")} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="flex-1">
                  Apply Adjustment
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};
export default StockAdjustment;
