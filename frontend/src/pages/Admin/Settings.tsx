import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/stores/authStore";
import { dataService } from "@/services/supabaseService";
import { CheckCircle2, Store, Receipt, AlertCircle, Clock } from "lucide-react";

export const AdminSettings: React.FC = () => {
  const { shop, setShop } = useAuthStore();
  const [name, setName] = useState(shop?.name || "");
  const [tagline, setTagline] = useState(shop?.tagline || "");
  const [address, setAddress] = useState(shop?.address || "");
  const [phone, setPhone] = useState(shop?.phone || "");
  const [gstNumber, setGstNumber] = useState(shop?.gst_number || "");
  const [taxRate, setTaxRate] = useState(
    shop?.tax_rate !== undefined && shop?.tax_rate !== null ? shop.tax_rate.toString() : "0"
  );
  const [receiptFooter, setReceiptFooter] = useState(
    shop?.receipt_footer || ""
  );
  const [attendanceType, setAttendanceType] = useState<"SINGLE" | "DOUBLE">(
    (shop?.attendance_type as "SINGLE" | "DOUBLE") || "SINGLE"
  );
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (shop) {
      setName(shop.name || "");
      setTagline(shop.tagline || "");
      setAddress(shop.address || "");
      setPhone(shop.phone || "");
      setGstNumber(shop.gst_number || "");
      setTaxRate(
        shop.tax_rate !== undefined && shop.tax_rate !== null ? shop.tax_rate.toString() : "0"
      );
      setReceiptFooter(shop.receipt_footer || "");
      setAttendanceType((shop.attendance_type as "SINGLE" | "DOUBLE") || "SINGLE");
    }
  }, [shop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop?.id) {
      setErrorMessage("No active shop found to update.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const parsedTax =
        taxRate !== "" && !isNaN(parseFloat(taxRate))
          ? parseFloat(taxRate)
          : 0;

      const updatedShop = await dataService.updateShop(shop.id, {
        name,
        tagline,
        address,
        phone,
        gst_number: gstNumber,
        tax_rate: parsedTax,
        receipt_footer: receiptFooter,
        attendance_type: attendanceType,
      });

      setShop(updatedShop);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error("Failed to update store settings:", err);
      setErrorMessage(err?.message || "Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
            Shop Profile & POS Configuration
          </h1>
          <p className="text-xs text-slate-500">
            Configure store metadata, tax rates, staff attendance mode, and printed thermal receipt layout
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

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
                placeholder="29ABCDE1234F1Z5"
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
                min="0"
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
              placeholder="e.g. Thank you for visiting! Have a refreshing day with our artisan Chai."
            />

            {/* Attendance Mode Configuration */}
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Clock className="w-4 h-4 text-amber-600" />
              Staff Attendance & Shift Configuration
            </h3>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Staff Attendance Punch Mode *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    attendanceType === "SINGLE"
                      ? "border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 text-slate-900 dark:text-white shadow-sm"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="adminAttendanceType"
                    value="SINGLE"
                    checked={attendanceType === "SINGLE"}
                    onChange={() => setAttendanceType("SINGLE")}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-sm font-bold block">Single Way Attendance</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                      Single punch per day (Mark Present / In once daily)
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    attendanceType === "DOUBLE"
                      ? "border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 text-slate-900 dark:text-white shadow-sm"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="adminAttendanceType"
                    value="DOUBLE"
                    checked={attendanceType === "DOUBLE"}
                    onChange={() => setAttendanceType("DOUBLE")}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-sm font-bold block">Double Way Attendance</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                      Double punch per day (Clock In & Clock Out for shift duration)
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" isLoading={isSaving}>
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
