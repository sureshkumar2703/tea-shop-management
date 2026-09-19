import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { dataService } from "@/services/supabaseService";
import { Supplier, InventoryItem } from "@/types";
import { ArrowLeft } from "lucide-react";

export const CreatePurchase: React.FC = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    dataService.getSuppliers().then((res) => {
      setSuppliers(res);
      if (res[0]) setSupplierId(res[0].id);
    });
    dataService.getInventory().then(setInventory);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate("/admin/purchases");
    }, 600);
  };

  return (
    <AdminLayout>
      <div className="max-w-xl mx-auto space-y-6">
        <button
          onClick={() => navigate("/admin/purchases")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Purchases
        </button>

        <div>
          <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
            Record Vendor Inward Purchase
          </h1>
          <p className="text-xs text-slate-500">Log ingredient shipment invoice and update stock</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Vendor / Supplier
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.contact_person || s.phone})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Invoice / Bill Number *"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="e.g. INV-90412"
                required
              />
              <Input
                label="Total Amount Paid (₹) *"
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="4500"
                required
              />
            </div>

            <Input
              label="Supplies Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 10kg Assam CTC Tea + 2kg Cardamom"
            />

            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="secondary" onClick={() => navigate("/admin/purchases")} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading} className="flex-1">
                Save Invoice
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
};
export default CreatePurchase;
