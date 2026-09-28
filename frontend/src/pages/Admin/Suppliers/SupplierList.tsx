import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { dataService } from "@/services/supabaseService";
import { useAuthStore } from "@/stores/authStore";
import { Supplier } from "@/types";
import {
  Plus,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Package,
  Building2,
  Truck,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { getPdfWatermarkCss, getPdfWatermarkHtml, getPdfHeaderHtml } from "@/lib/pdfUtils";

export const SupplierList: React.FC = () => {
  const { shop, user } = useAuthStore();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [companyName, setCompanyName] = useState("");
  const [productName, setProductName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [email, setEmail] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 15");
  const [isActive, setIsActive] = useState(true);

  // Validation Error States
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");

  const loadSuppliers = async () => {
    const data = await dataService.getSuppliers(shop?.id);
    setSuppliers(data);
  };

  useEffect(() => {
    loadSuppliers();
  }, [shop?.id]);

  const validatePhone = (val: string): boolean => {
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned) {
      setPhoneError("Phone number is required");
      return false;
    }
    if (cleaned.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits");
      return false;
    }
    setPhoneError("");
    return true;
  };

  const validateEmail = (val: string): boolean => {
    if (!val || val.trim() === "") {
      setEmailError("");
      return true;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) {
      setEmailError("Please enter a valid email address (e.g. name@domain.com)");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setCompanyName("");
    setProductName("");
    setContactPerson("");
    setCompanyPhone("");
    setCompanyAddress("");
    setEmail("");
    setPaymentTerms("Net 15");
    setIsActive(true);
    setPhoneError("");
    setEmailError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setCompanyName(supplier.company_name || supplier.name || "");
    setProductName(supplier.product_name || supplier.notes || "");
    setContactPerson(supplier.contact_person || "");
    setCompanyPhone(supplier.company_phone || supplier.phone || "");
    setCompanyAddress(supplier.company_address || supplier.address || "");
    setEmail(supplier.email || "");
    setPaymentTerms(supplier.payment_terms || "Net 15");
    setIsActive(supplier.is_active !== false);
    setPhoneError("");
    setEmailError("");
    setModalOpen(true);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const digitsOnly = rawVal.replace(/\D/g, "").slice(0, 10);
    setCompanyPhone(digitsOnly);
    if (digitsOnly.length > 0 && digitsOnly.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits");
    } else {
      setPhoneError("");
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (val.trim()) {
      validateEmail(val);
    } else {
      setEmailError("");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const isPhoneValid = validatePhone(companyPhone);
    const isEmailValid = validateEmail(email);

    if (!companyName.trim()) return;
    if (!isPhoneValid || !isEmailValid) return;

    setIsSaving(true);
    const targetShopId = shop?.id || user?.shop_id || "a1111111-1111-1111-1111-111111111111";

    const payloadData: Partial<Supplier> = {
      shop_id: targetShopId,
      name: companyName.trim(),
      company_name: companyName.trim(),
      product_name: productName.trim(),
      contact_person: contactPerson.trim(),
      phone: companyPhone.trim(),
      company_phone: companyPhone.trim(),
      email: email.trim() || undefined,
      address: companyAddress.trim() || undefined,
      company_address: companyAddress.trim() || undefined,
      payment_terms: paymentTerms || "Net 15",
      is_active: isActive,
    };

    try {
      if (editingSupplier) {
        const updated = await dataService.updateSupplier(editingSupplier.id, payloadData);
        setSuppliers((prev) =>
          prev.map((s) => (s.id === editingSupplier.id ? { ...s, ...updated } : s))
        );
      } else {
        const created = await dataService.createSupplier(payloadData);
        setSuppliers((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      setEditingSupplier(null);
    } catch (err) {
      console.error("Failed to save supplier:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (id: string, newActive: boolean) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: newActive } : s))
    );
    try {
      await dataService.updateSupplierStatus(id, newActive);
    } catch (err) {
      console.error("Failed to update supplier status:", err);
      loadSuppliers();
    }
  };

  // EXPORT TO PDF / PRINT REPORT
  const handleDownloadPDF = () => {
    if (suppliers.length === 0) {
      alert("No supplier data available to download.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups in your browser to download/print the PDF report.");
      return;
    }

    const tableRowsHtml = suppliers
      .map((s, idx) => {
        const displayName = s.company_name || s.name;
        const prod = s.product_name || s.notes || "General Supplies";
        const ph = s.company_phone || s.phone || "N/A";
        const addr = s.company_address || s.address || "-";
        const isAct = s.is_active !== false;

        return `
        <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 0 ? "background-color: #f8fafc;" : ""}">
          <td style="padding: 9px 10px; font-weight: 700; color: #0f172a;">
            ${displayName}
            ${s.contact_person ? `<div style="font-size: 11px; font-weight: 500; color: #64748b;">Contact: ${s.contact_person}</div>` : ""}
          </td>
          <td style="padding: 9px 10px; font-weight: 600; color: #b45309;">
            ${prod}
          </td>
          <td style="padding: 9px 10px;">
            <div style="font-weight: 600; color: #0f172a;">${ph}</div>
            ${s.email ? `<div style="font-size: 11px; color: #64748b;">${s.email}</div>` : ""}
          </td>
          <td style="padding: 9px 10px; font-size: 11px; color: #475569;">
            ${addr}
          </td>
          <td style="padding: 9px 10px; text-align: center;">
            <span style="font-size: 11px; font-weight: 600; color: #334155;">${s.payment_terms || "Net 15"}</span>
          </td>
          <td style="padding: 9px 10px; text-align: center;">
            <span style="display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; ${
              isAct ? "background-color: #dcfce7; color: #15803d;" : "background-color: #ffe4e6; color: #be123c;"
            }">
              ${isAct ? "ACTIVE" : "INACTIVE"}
            </span>
          </td>
        </tr>
      `;
      })
      .join("");

    const shopName = shop?.name || "Tea Shop";
    const shopAddress = shop?.address || "";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Suppliers Directory Report - ${shopName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 25px; color: #1e293b; position: relative; }
          .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 15px; }
          th { background-color: #f1f5f9; padding: 10px; text-align: left; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1; }
          .footer-summary { margin-top: 25px; display: flex; justify-content: flex-end; }
          .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 18px; }
          ${getPdfWatermarkCss()}
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        ${getPdfWatermarkHtml(shopName, shop?.logo_url)}
        ${getPdfHeaderHtml(shopName, shopAddress, "SUPPLIERS & VENDORS DIRECTORY", shop?.logo_url)}

        <table>
          <thead>
            <tr>
              <th>Company / Vendor Name</th>
              <th>Product / Materials</th>
              <th>Phone & Email</th>
              <th>Address</th>
              <th style="text-align: center;">Payment Terms</th>
              <th style="text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="footer-summary">
          <div class="summary-card">
            <div style="font-size: 12px; color: #64748b;">
              Total Registered Suppliers: <strong style="color: #0f172a; font-size: 14px;">${suppliers.length}</strong>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // EXPORT TO EXCEL / CSV
  const handleDownloadExcel = () => {
    if (suppliers.length === 0) {
      alert("No supplier data available to download.");
      return;
    }

    const headers = [
      "Company Name",
      "Product / Materials Supplied",
      "Contact Person",
      "Phone Number",
      "Email Address",
      "Company Address",
      "Payment Terms",
      "Status",
    ];

    const rows = suppliers.map((s) => {
      const displayName = s.company_name || s.name || "";
      const prod = s.product_name || s.notes || "";
      const ph = s.company_phone || s.phone || "";
      const addr = s.company_address || s.address || "";
      const isAct = s.is_active !== false ? "ACTIVE" : "INACTIVE";

      return [
        `"${displayName.replace(/"/g, '""')}"`,
        `"${prod.replace(/"/g, '""')}"`,
        `"${(s.contact_person || "").replace(/"/g, '""')}"`,
        `"${ph}"`,
        `"${s.email || ""}"`,
        `"${addr.replace(/"/g, '""')}"`,
        `"${s.payment_terms || "Net 15"}"`,
        `"${isAct}"`,
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `suppliers_directory_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      key: "name",
      header: "Company & Vendor",
      render: (s: Supplier) => {
        const displayName = s.company_name || s.name;
        const displayAddress = s.company_address || s.address;
        return (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">{displayName}</span>
              {s.contact_person && (
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  Contact: {s.contact_person}
                </span>
              )}
              {displayAddress && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  {displayAddress}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "product_name",
      header: "Product / Materials Supplied",
      render: (s: Supplier) => {
        const prod = s.product_name || s.notes;
        return prod ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold border border-amber-500/20">
            <Package className="w-3.5 h-3.5" />
            <span>{prod}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">General Materials</span>
        );
      },
    },
    {
      key: "phone",
      header: "Contact Phone & Email",
      render: (s: Supplier) => {
        const ph = s.company_phone || s.phone;
        return (
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
              <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{ph || "N/A"}</span>
            </div>
            {s.email && (
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{s.email}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "payment_terms",
      header: "Payment Terms",
      render: (s: Supplier) => (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {s.payment_terms || "Net 15"}
        </span>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      render: (s: Supplier) => {
        const isAct = s.is_active !== false;
        return (
          <select
            value={isAct ? "ACTIVE" : "INACTIVE"}
            onChange={(e) => handleStatusChange(s.id, e.target.value === "ACTIVE")}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold border cursor-pointer transition-all outline-none ${
              isAct
                ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
            }`}
          >
            <option value="ACTIVE">● ACTIVE</option>
            <option value="INACTIVE">○ INACTIVE</option>
          </select>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (s: Supplier) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleOpenEdit(s)}
            title="Edit Supplier"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-300 dark:text-slate-400 dark:hover:text-amber-300 dark:hover:bg-amber-950/40 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-6 h-6 text-amber-500" />
              Suppliers & Vendors
            </h1>
            <p className="text-xs text-slate-500">
              Directory of tea gardens, local dairies, spice merchants, and packaging suppliers
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              onClick={handleDownloadExcel}
              className="text-xs font-semibold"
            >
              Export Excel
            </Button>
            <Button
              variant="secondary"
              icon={<FileText className="w-4 h-4 text-rose-600" />}
              onClick={handleDownloadPDF}
              className="text-xs font-semibold"
            >
              Export PDF
            </Button>
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd}>
              Add Supplier
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={suppliers}
          searchKey="name"
          searchPlaceholder="Search suppliers by company name or contact..."
        />
      </div>

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingSupplier(null);
        }}
        title={editingSupplier ? "Edit Supplier Details" : "Register Supplier"}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Company / Vendor Name *"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Kerala Spices Mandi Pvt Ltd"
            required
          />

          <Input
            label="Product Name / Materials Supplied *"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g. CTC Assam Tea, Roasted Cardamom, Buffalo Milk"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Person"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="e.g. Suresh Gowda"
            />
            <div>
              <Input
                label="Company Phone Number (10 Digits) *"
                type="tel"
                value={companyPhone}
                onChange={handlePhoneChange}
                placeholder="9876543210"
                maxLength={10}
                required
                className={phoneError ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500" : ""}
              />
              {phoneError && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">{phoneError}</p>
              )}
            </div>
          </div>

          <Input
            label="Company Address"
            value={companyAddress}
            onChange={(e) => setCompanyAddress(e.target.value)}
            placeholder="e.g. Shop #12, APMC Market Yard, Bengaluru, Karnataka"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="orders@vendor.com"
                className={emailError ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500" : ""}
              />
              {emailError && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">{emailError}</p>
              )}
            </div>
            <Input
              label="Payment Terms"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="e.g. Net 15, Daily UPI, Cash on Delivery"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Default Status</span>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-600">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600"
              />
              <span>Active Supplier</span>
            </label>
          </div>

          <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                setEditingSupplier(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={isSaving}>
              {isSaving ? "Saving..." : editingSupplier ? "Update Supplier" : "Save Supplier"}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
};
export default SupplierList;
