import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { dataService } from "@/services/supabaseService";
import { Supplier } from "@/types";
import { Plus, Store, Phone, Mail, MapPin } from "lucide-react";

export const SupplierList: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 15");

  useEffect(() => {
    dataService.getSuppliers().then(setSuppliers);
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      shop_id: "a1111111-1111-1111-1111-111111111111",
      name,
      contact_person: contactPerson,
      phone,
      email,
      payment_terms: paymentTerms,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    setSuppliers([...suppliers, newSup]);
    setName("");
    setContactPerson("");
    setPhone("");
    setEmail("");
    setModalOpen(false);
  };

  const columns = [
    {
      key: "name",
      header: "Vendor / Merchant",
      render: (s: Supplier) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white block">{s.name}</span>
          <span className="text-xs text-slate-400">{s.contact_person ? `Contact: ${s.contact_person}` : ""}</span>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Contact Info",
      render: (s: Supplier) => (
        <div className="text-xs space-y-0.5">
          <p className="text-slate-800 dark:text-slate-200 font-medium">{s.phone}</p>
          {s.email && <p className="text-slate-400">{s.email}</p>}
        </div>
      ),
    },
    {
      key: "payment_terms",
      header: "Payment Terms",
      render: (s: Supplier) => <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{s.payment_terms || "Immediate"}</span>,
    },
    {
      key: "is_active",
      header: "Status",
      render: (s: Supplier) => <Badge variant={s.is_active ? "success" : "neutral"}>ACTIVE</Badge>,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
              Suppliers & Vendors
            </h1>
            <p className="text-xs text-slate-500">
              Directory of tea gardens, local dairies, spice merchants, and packaging suppliers
            </p>
          </div>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setModalOpen(true)}>
            Add Supplier
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={suppliers}
          searchKey="name"
          searchPlaceholder="Search suppliers..."
        />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register Supplier" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Vendor / Firm Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Kerala Spices Mandi"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Person"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="e.g. Suresh Gowda"
            />
            <Input
              label="Phone Number *"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="orders@vendor.com"
            />
            <Input
              label="Payment Terms"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="Net 15 / Daily UPI"
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              Save Supplier
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
};
export default SupplierList;
