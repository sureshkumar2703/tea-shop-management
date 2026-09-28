import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/stores/authStore";
import { dataService } from "@/services/supabaseService";
import { Country, State, City } from "country-state-city";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { ArrowLeft, ShieldCheck, Eye, EyeOff, AlertCircle } from "lucide-react";

export const AdminCreateAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { shop } = useAuthStore();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [address, setAddress] = useState("");

  const [countryCode, setCountryCode] = useState("IN");
  const [countryName, setCountryName] = useState("India");
  const [stateCode, setStateCode] = useState("KA");
  const [stateName, setStateName] = useState("Karnataka");
  const [district, setDistrict] = useState("Bangalore Urban");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(() => (countryCode ? State.getStatesOfCountry(countryCode) : []), [countryCode]);
  const cities = useMemo(
    () => (countryCode && stateCode ? City.getCitiesOfState(countryCode, stateCode) : []),
    [countryCode, stateCode]
  );

  const validateEmail = (val: string) => {
    if (!val.trim()) {
      setEmailError("Email address is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) {
      setEmailError("Please enter a valid email address (e.g. name@domain.com)");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (emailError) {
      validateEmail(val);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Restrict to numbers only, max 10 digits
    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(cleaned);
    if (cleaned.length > 0 && cleaned.length < 10) {
      setPhoneError("Phone number must be exactly 10 digits");
    } else {
      setPhoneError("");
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCountryName(val);
    const found = countries.find(
      (c) => c.name.toLowerCase() === val.toLowerCase() || c.isoCode.toLowerCase() === val.toLowerCase()
    );
    if (found) {
      setCountryCode(found.isoCode);
      setCountryName(found.name);
      setStateCode("");
      setStateName("");
      setDistrict("");
    } else {
      setCountryCode("");
      setStateCode("");
      setStateName("");
      setDistrict("");
    }
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStateName(val);
    const found = states.find(
      (s) => s.name.toLowerCase() === val.toLowerCase() || s.isoCode.toLowerCase() === val.toLowerCase()
    );
    if (found) {
      setStateCode(found.isoCode);
      setStateName(found.name);
      setDistrict("");
    } else {
      setStateCode("");
      setDistrict("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setFormError("Please fill in all mandatory fields.");
      return;
    }

    if (!validateEmail(email)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    if (phone.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits");
      setFormError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!address.trim() || !countryName.trim() || !stateName.trim() || !district.trim()) {
      setFormError("Please complete address, country, state, and district fields.");
      return;
    }

    setIsLoading(true);

    try {
      await dataService.createAdmin({
        shop_id: shop?.id || "a1111111-1111-1111-1111-111111111111",
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        address: address.trim(),
        country: countryName.trim(),
        state: stateName.trim(),
        district: district.trim(),
        role: "OWNER",
      });

      setIsLoading(false);
      navigate("/admin/admins");
    } catch (err: any) {
      setIsLoading(false);
      setFormError(err?.message || "Failed to create store owner account.");
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={() => navigate("/admin/admins")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Admin & Owner List
        </button>

        <div>
          <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
            Create Co-Owner
          </h1>
          <p className="text-xs text-slate-500">
            Provision co-owner credentials for this franchise with default shop code
          </p>
        </div>

        {formError && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

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
              label="Owner Full Name *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rohan Verma"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Email Address *"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={() => validateEmail(email)}
                  placeholder="owner@chaicraft.in"
                  error={emailError}
                  required
                />
              </div>
              <div>
                <Input
                  label="Phone Number (10 Digits) *"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  onBlur={() => {
                    if (phone && phone.length !== 10) {
                      setPhoneError("Phone number must be exactly 10 digits");
                    }
                  }}
                  placeholder="9876543210"
                  maxLength={10}
                  error={phoneError}
                  required
                />
              </div>
            </div>

            <Input
              label="Residential / Local Address *"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Flat 102, Shanthi Nivas, Indiranagar"
              required
            />

            {/* Country, State, District Cascading Searchable Selects */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SearchableSelect
                label="Country *"
                value={countryName}
                options={countries.map((c) => ({ value: c.isoCode, label: c.name }))}
                onChange={(val, opt) => {
                  setCountryName(val);
                  if (opt) {
                    setCountryCode(opt.value);
                  } else {
                    const found = countries.find(
                      (c) =>
                        c.name.toLowerCase() === val.toLowerCase() ||
                        c.isoCode.toLowerCase() === val.toLowerCase()
                    );
                    setCountryCode(found?.isoCode || "");
                  }
                  setStateCode("");
                  setStateName("");
                  setDistrict("");
                }}
                onClear={() => {
                  setCountryCode("");
                  setCountryName("");
                  setStateCode("");
                  setStateName("");
                  setDistrict("");
                }}
                placeholder="Type or select Country"
                required
              />

              <SearchableSelect
                label="State *"
                value={stateName}
                options={states.map((s) => ({ value: s.isoCode, label: s.name }))}
                onChange={(val, opt) => {
                  setStateName(val);
                  if (opt) {
                    setStateCode(opt.value);
                  } else {
                    const found = states.find(
                      (s) =>
                        s.name.toLowerCase() === val.toLowerCase() ||
                        s.isoCode.toLowerCase() === val.toLowerCase()
                    );
                    setStateCode(found?.isoCode || "");
                  }
                  setDistrict("");
                }}
                onClear={() => {
                  setStateCode("");
                  setStateName("");
                  setDistrict("");
                }}
                disabled={!countryCode}
                placeholder={countryCode ? "Type or select State" : "Select Country first"}
                required
              />

              <SearchableSelect
                label="District / City *"
                value={district}
                options={cities.map((c) => ({ value: c.name, label: c.name }))}
                onChange={(val) => setDistrict(val)}
                onClear={() => setDistrict("")}
                disabled={!stateCode}
                placeholder={stateCode ? "Type or select District" : "Select State first"}
                required
              />
            </div>

            <div className="relative">
              <Input
                label="Account Password *"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password for co-owner"
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
                onClick={() => navigate("/admin/admins")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading} className="flex-1">
                Save & Create Co-Owner
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
};
export default AdminCreateAdmin;
