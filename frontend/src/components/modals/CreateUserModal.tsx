import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { UserRole, Profile, Shop } from "@/types";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
  shops?: Shop[];
  onSuccess: (newUser: Profile) => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  defaultRole = "EMPLOYEE",
  shops = [],
  onSuccess,
}) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [shopId, setShopId] = useState(shops[0]?.id || "");
  const [salary, setSalary] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;
    setIsLoading(true);

    const newUser: Profile = {
      id: `usr-${Date.now()}`,
      full_name: fullName,
      email,
      phone,
      role,
      shop_id: shopId,
      monthly_salary: parseFloat(salary) || 0,
      is_active: true,
      joining_date: new Date().toISOString().split("T")[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTimeout(() => {
      setIsLoading(false);
      onSuccess(newUser);
      onClose();
    }, 600);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={role === "ADMIN" ? "Register Shop Admin / Owner" : "Add Staff Member (Barista / Cashier)"}
      description="Create credentials and assign access level for team members"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name *"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Priya Sharma"
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Email Address *"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="priya@chaicraft.in"
            required
          />
          <Input
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 11223"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Role Permission
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="EMPLOYEE">Employee (Barista / POS Cashier)</option>
              <option value="OWNER">Shop Admin / Store Owner</option>
              <option value="ADMIN">Super Admin (Platform Owner)</option>
            </select>
          </div>

          <Input
            label="Monthly Base Salary (₹)"
            type="number"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="22000"
          />
        </div>

        {shops.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Assigned Store Branch
            </label>
            <select
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            >
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.slug})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} className="flex-1">
            Save User
          </Button>
        </div>
      </form>
    </Modal>
  );
};
