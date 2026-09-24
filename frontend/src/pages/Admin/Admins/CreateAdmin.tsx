import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/stores/authStore";
import { dataService } from "@/services/supabaseService";
import { ArrowLeft, ShieldCheck, Eye, EyeOff, Store } from "lucide-react";

export const AdminCreateAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { shop } = useAuthStore();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("India");
  const [state, setState] = useState("Karnataka");
  const [district, setDistrict] = useState("Bangalore Urban");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) return;
    setIsLoading(true);

    await dataService.createAdmin({
      shop_id: shop?.id || "a1111111-1111-1111-1111-111111111111",
      full_name: fullName,
      email,
      phone,
      password,
      address,
      country,
      state,
      district,
      role: "ADMIN",
    });

    setIsLoading(false);
    navigate("/admin/employees");
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={() => navigate("/admin/employees")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Staff & Admins
        </button>

        <div>
          <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
            Create Co-Admin / Store Manager
          </h1>
          <p className="text-xs text-slate-500">
            Provision administrative credentials for this franchise with default shop code
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Default Shop Code Display */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block">
                  Store Franchise Branch
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {shop?.name || "Chai Craft Artisan Bar"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block">
                  Shop Code (Default)
                </span>
                <span className="text-base font-mono font-black text-amber-900 dark:text-amber-200 px-2.5 py-0.5 rounded bg-amber-500/20">
                  {shop?.shop_code || "TEA-BLR01"}
                </span>
              </div>
            </div>

            <Input
              label="Admin Full Name *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rohan Verma"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@chaicraft.in"
                required
              />
              <Input
                label="Phone Number *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 97654 32109"
                required
              />
            </div>

            <Input
              label="Residential / Local Address *"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Flat 102, Shanthi Nivas, Indiranagar"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Country *"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="India"
                required
              />
              <Input
                label="State *"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Karnataka"
                required
              />
              <Input
                label="District *"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Bangalore Urban"
                required
              />
            </div>

            <div className="relative">
              <Input
                label="Account Password *"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password for co-admin"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/admin/employees")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading} className="flex-1">
                Save & Create Admin
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
};
export default AdminCreateAdmin;
