import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { dataService } from "@/services/supabaseService";
import { useAuthStore } from "@/stores/authStore";
import { Supplier, Product } from "@/types";
import { ArrowLeft, Lock, Calendar, Building2, Package, Hash } from "lucide-react";

export const CreatePurchase: React.FC = () => {
  const navigate = useNavigate();
  const { shop } = useAuthStore();
  const shopId = shop?.id || "a1111111-1111-1111-1111-111111111111";

  const todayDate = new Date().toISOString().split("T")[0];

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vendorInput, setVendorInput] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [productName, setProductName] = useState("");
  const [totalQty, setTotalQty] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI_QR">("UPI_QR");
  const [notes, setNotes] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(true);
  const [checkingRegister, setCheckingRegister] = useState(true);

  useEffect(() => {
    dataService.getSuppliers(shopId).then((res) => {
      setSuppliers(res);
      if (res && res.length > 0) {
        setVendorInput(res[0].company_name || res[0].name);
        setSelectedSupplierId(res[0].id);
        if (res[0].product_name) {
          setProductName(res[0].product_name);
        }
      }
    });

    dataService.getProducts(shopId).then(setProducts);

    const checkStatus = async () => {
      setCheckingRegister(true);
      const dp = await dataService.getTodayDatepay(shopId, todayDate);
      setIsRegisterOpen(dp?.status === "OPEN");
      setCheckingRegister(false);
    };
    checkStatus();
  }, [shopId, todayDate]);

  const handleVendorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setVendorInput(val);
    const found = suppliers.find(
      (s) =>
        (s.company_name || s.name).toLowerCase() === val.toLowerCase() ||
        s.name.toLowerCase() === val.toLowerCase()
    );
    if (found) {
      setSelectedSupplierId(found.id);
      if (found.product_name && !productName) {
        setProductName(found.product_name);
      }
    } else {
      setSelectedSupplierId("");
    }
  };

  const handleVendorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedSupplierId(id);
    const found = suppliers.find((s) => s.id === id);
    if (found) {
      setVendorInput(found.company_name || found.name);
      if (found.product_name) {
        setProductName(found.product_name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRegisterOpen) {
      alert("⚠️ Today's register is CLOSED or Opening Cash has not been entered. Please open today's register in Datepay first.");
      return;
    }

    if (!vendorInput.trim()) {
      alert("Please enter or select a vendor / supplier.");
      return;
    }

    setIsLoading(true);
    const amt = parseFloat(totalAmount) || 0;
    const qty = parseFloat(totalQty) || 0;
    const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

    try {
      await dataService.createPurchase({
        shop_id: shopId,
        supplier_id: selectedSupplierId || undefined,
        supplier_name: vendorInput.trim(),
        product_name: productName.trim(),
        total_qty: qty,
        invoice_number: invoiceNo.trim() || `INV-${Date.now().toString().slice(-4)}`,
        purchase_date: todayDate,
        total_amount: amt,
        paid_amount: amt,
        payment_status: "PAID",
        payment_method: paymentMethod,
        notes: notes.trim(),
        supplier: selectedSupplier,
      });

      navigate("/admin/purchases");
    } catch (err) {
      console.error("Failed to record purchase:", err);
      alert("Failed to save purchase invoice. Please check the inputs.");
    } finally {
      setIsLoading(false);
    }
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

        {!checkingRegister && !isRegisterOpen && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-rose-900 dark:text-rose-200">
                  Register is CLOSED for Today
                </h3>
                <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                  Cannot record new purchases while today's register is closed or uninitialized.
                </p>
              </div>
            </div>
            <Link
              to="/admin/datepay"
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 transition-colors shadow-sm"
            >
              Open Register &rarr;
            </Link>
          </div>
        )}

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Vendor Input & Dropdown Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Vendor / Supplier *
                </label>
                {suppliers.length > 0 && (
                  <span className="text-[11px] text-slate-400">
                    Type or choose from dropdown
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    list="vendors-datalist"
                    value={vendorInput}
                    onChange={handleVendorInputChange}
                    placeholder="Type or search vendor name..."
                    disabled={!isRegisterOpen}
                    required
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
                  />
                  <datalist id="vendors-datalist">
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.company_name || s.name}>
                        {s.contact_person ? `Contact: ${s.contact_person} (${s.phone})` : s.phone}
                      </option>
                    ))}
                  </datalist>
                </div>

                {suppliers.length > 0 && (
                  <select
                    value={selectedSupplierId}
                    onChange={handleVendorSelect}
                    disabled={!isRegisterOpen}
                    className="w-40 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-60"
                  >
                    <option value="">Choose...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.company_name || s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Product Name & Total Qty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product / Ingredient Name *
                </label>
                <input
                  type="text"
                  list="products-datalist"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. CTC Assam Tea, Milk, Cardamom"
                  disabled={!isRegisterOpen}
                  required
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
                />
                <datalist id="products-datalist">
                  {products.map((p) => (
                    <option key={p.id} value={p.name} />
                  ))}
                  <option value="CTC Assam Tea Leaves" />
                  <option value="Fresh Cow / Buffalo Milk" />
                  <option value="Green Elaichi / Cardamom" />
                  <option value="Ginger / Adrak" />
                  <option value="Sugar / Jaggery" />
                  <option value="Kulhad Earthen Cups" />
                  <option value="Paper Cups / Straws" />
                </datalist>
              </div>

              <div>
                <Input
                  label="Total Qty (Units / Kg / Packs) *"
                  type="number"
                  step="0.01"
                  min="0"
                  value={totalQty}
                  onChange={(e) => setTotalQty(e.target.value)}
                  placeholder="e.g. 50"
                  disabled={!isRegisterOpen}
                  required
                />
              </div>
            </div>

            {/* Invoice Number & Current Date (Disabled) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Invoice / Bill Number *"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="e.g. INV-90412"
                disabled={!isRegisterOpen}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  Purchase Date (Today - Locked)
                </label>
                <input
                  type="date"
                  value={todayDate}
                  disabled
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 px-3.5 py-2 text-sm text-slate-600 dark:text-slate-300 cursor-not-allowed font-medium"
                />
              </div>
            </div>

            {/* Total Amount Paid */}
            <div>
              <Input
                label="Total Amount Paid (₹) *"
                type="number"
                step="0.01"
                min="0"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="e.g. 4500"
                disabled={!isRegisterOpen}
                required
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Payment Method Used
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("UPI_QR")}
                  disabled={!isRegisterOpen}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    paymentMethod === "UPI_QR"
                      ? "bg-amber-50 border-amber-500 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                      : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400"
                  }`}
                >
                  Google Pay / UPI
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  disabled={!isRegisterOpen}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    paymentMethod === "CASH"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                      : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400"
                  }`}
                >
                  Cash (Drawer / Hand)
                </button>
              </div>
            </div>

            <Input
              label="Supplies Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 10kg Assam CTC Tea + 2kg Cardamom"
              disabled={!isRegisterOpen}
            />

            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="secondary" onClick={() => navigate("/admin/purchases")} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                variant={!isRegisterOpen ? "secondary" : "primary"}
                isLoading={isLoading}
                disabled={!isRegisterOpen}
                className="flex-1"
              >
                {!isRegisterOpen ? "Register Closed" : "Save Invoice"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
};
export default CreatePurchase;
