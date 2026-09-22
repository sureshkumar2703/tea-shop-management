import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { dataService } from "@/services/supabaseService";
import { Shop } from "@/types";
import { ArrowLeft, KeyRound, ShieldCheck, Store, Lock, Eye, EyeOff } from "lucide-react";

export const SuperAdminCreateAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramShopId = searchParams.get("shopId");

  const [shops, setShops] = useState<Shop[]>([]);
  const [shopId, setShopId] = useState(paramShopId || "");
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

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

  useEffect(() => {
    dataService.getShops().then((res) => {
      setShops(res);
      if (paramShopId) {
        const found = res.find((s) => s.id === paramShopId);
        if (found) {
          setShopId(found.id);
          setSelectedShop(found);
          return;
        }
      }
      if (res[0] && !shopId) {
        setShopId(res[0].id);
        setSelectedShop(res[0]);
      }
    });
  }, [paramShopId]);

  const handleShopChange = (id: string) => {
    setShopId(id);
    const found = shops.find((s) => s.id === id);
    setSelectedShop(found || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !shopId) return;
    setIsLoading(true);

    await dataService.createAdmin({
      shop_id: shopId,
      full_name: fullName,
      email,
      phone,
      address,
      country,
      state,
      district,
      role: "OWNER",
    });

    setIsLoading(false);
    navigate("/super-admin/admins");
  };

  return (
    <SuperAdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={() => navigate("/super-admin/admins")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Admins
        </button>

        <div>
          <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
            Register Store Owner / Admin
          </h1>
          <p className="text-xs text-slate-500">
            Create administrative login credentials linked to the franchise branch and auto-assigned shop code
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Franchise Selection & Auto-Display of Shop Code */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <label className="block text-xs font-bold text-amber-900 dark:text-amber-200">
                Select Shop Franchise *
              </label>
              <select
                value={shopId}
                onChange={(e) => handleShopChange(e.target.value)}
                className="w-full rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 font-semibold"
                required
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.shop_code || "Code Pending"})
                  </option>
                ))}
              </select>

              {/* Default Shop Code Display */}
              <div className="flex items-center justify-between pt-2 border-t border-amber-500/20">
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                  Shop Code (Default):
                </span>
                <span className="text-sm font-mono font-black px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-900 dark:text-amber-200">
                  {selectedShop?.shop_code || "TEA-AUTO"}
                </span>
              </div>
            </div>

            {/* Admin Personal Details */}
            <Input
              label="Admin Full Name *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Vikramaditya Rathore"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@franchise.in"
                required
              />
              <Input
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>

            {/* Address & Geographical Location */}
            <Input
              label="Residential / Office Address *"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Flat 302, Green Glen Layout, Bellandur"
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

            {/* Password */}
            <div className="relative">
              <Input
                label="Account Password *"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Set secure login password"
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
                onClick={() => navigate("/super-admin/admins")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading} className="flex-1">
                Save & Register Admin
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};
export default SuperAdminCreateAdmin;
