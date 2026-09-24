import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { UserRole, Profile, Shop } from "@/types";
import { dataService } from "@/services/supabaseService";
import { Lock, Eye, EyeOff } from "lucide-react";

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
  defaultRole = "OWNER",
  shops = [],
  onSuccess,
}) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("India");
  const [state, setState] = useState("Tamil Nadu");
  const [district, setDistrict] = useState("Salem");
  const [role, setRole] = useState<UserRole>(defaultRole || "OWNER");
  const [shopId, setShopId] = useState(shops[0]?.id || "");
  const [salary, setSalary] = useState("25000");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!fullName || !email || !password) {
      setErrorMessage("Please fill in all required fields including password.");
      return;
    }
    setIsLoading(true);

    try {
      const selectedShopId = shopId || (shops[0]?.id) || undefined;
      const targetRole: UserRole = role || "OWNER";
      let createdUser: Profile;

      if (targetRole === "EMPLOYEE") {
        createdUser = await dataService.createEmployee({
          shop_id: selectedShopId,
          full_name: fullName,
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password: password,
          address: address.trim(),
          country: country.trim(),
          state: state.trim(),
          district: district.trim(),
          role: "EMPLOYEE",
          monthly_salary: parseFloat(salary) || 0,
        });
      } else {
        createdUser = await dataService.createAdmin({
          shop_id: selectedShopId,
          full_name: fullName,
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password: password,
          address: address.trim(),
          country: country.trim(),
          state: state.trim(),
          district: district.trim(),
          role: targetRole,
          monthly_salary: parseFloat(salary) || 0,
        });
      }

      setIsLoading(false);
      onSuccess(createdUser);
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || "Failed to create user account.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register Store Owner / Admin"
      description="Create credentials and assign store branch with default Owner access"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs text-rose-700">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Full Name *"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Priya Sharma"
            required
          />
          <Input
            label="Email Address *"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="priya@chaicraft.in"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 11223"
          />

          {/* Password field */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Login Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 pr-10 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Address & Geographical Fields */}
        <Input
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Shop / House Address, Street, Area"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="India"
          />
          <Input
            label="State"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="Tamil Nadu"
          />
          <Input
            label="District / City"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="Salem"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Role Permission (Default: OWNER)
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 font-bold"
            >
              <option value="OWNER">Shop Admin / Store Owner (Default: OWNER)</option>
              <option value="ADMIN">Super Admin (Platform Owner)</option>
              <option value="EMPLOYEE">Employee (Barista / POS Staff)</option>
            </select>
          </div>

          <Input
            label="Monthly Base Salary (₹)"
            type="number"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="25000"
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
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 font-medium"
            >
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.shop_code || s.slug})
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
            Save User as Owner
          </Button>
        </div>
      </form>
    </Modal>
  );
};
