import React, { useState } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/stores/authStore";
import { CheckCircle2, Store, Receipt, Printer } from "lucide-react";

export const AdminSettings: React.FC = () => {
  const { shop, setShop } = useAuthStore();
  const [name, setName] = useState(shop?.name || "Chai Craft Artisan Bar");
  const [tagline, setTagline] = useState(shop?.tagline || "Authentic Handcrafted Kulhad Chai & Warm Street Delicacies");
  const [address, setAddress] = useState(shop?.address || "Plot 42, Brigade Road, Bangalore - 560001");
  const [phone, setPhone] = useState(shop?.phone || "+91 98765 43210");
  const [gstNumber, setGstNumber] = useState(shop?.gst_number || "29ABCDE1234F1Z5");
  const [taxRate, setTaxRate] = useState(shop?.tax_rate?.toString() || "5.0");
  const [receiptFooter, setReceiptFooter] = useState(
    shop?.receipt_footer || "Thank you for visiting! Have a refreshing day with our artisan Chai."
  );
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (shop) {
      const updated = {
        ...shop,
        name,
        tagline,
        address,
        phone,
        gst_number: gstNumber,
        tax_rate: parseFloat(taxRate) || 5.0,
        receipt_footer: receiptFooter,
      };
      setShop(updated);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
            Shop Profile & POS Configuration
          </h1>
          <p className="text-xs text-slate-500">
            Configure store metadata, tax rates, and printed thermal receipt layout
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-amber-600" />
              Store Identification
            </h3>

            <Input
              label="Store / Brand Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Tagline / Description"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />

            <Input
              label="Complete Street Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Store Contact Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label="GSTIN Identification Number"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
              />
            </div>

            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Receipt className="w-4 h-4 text-amber-600" />
              Tax & Thermal Receipt Printing
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Default GST Tax Rate (%)"
                type="number"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  disabled
                  value="INR (₹)"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <Input
              label="Thermal Receipt Footer Message"
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              placeholder="e.g. Thank you for visiting! Tag us on Instagram @chaicraft"
            />

            <div className="pt-2">
              <Button type="submit" variant="primary">
                Save Store Settings
              </Button>
            </div>

            {saved && (
              <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1 mt-2 animate-bounce">
                <CheckCircle2 className="w-4 h-4" /> Store preferences updated successfully!
              </p>
            )}
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
};
export default AdminSettings;
