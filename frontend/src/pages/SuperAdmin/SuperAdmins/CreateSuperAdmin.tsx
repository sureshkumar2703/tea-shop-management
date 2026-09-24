import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { dataService } from "@/services/supabaseService";
import { Country, State, City } from "country-state-city";
import { getCountryCallingCode } from "libphonenumber-js";
import { ArrowLeft, ShieldCheck, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

export const CreateSuperAdminPage: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [countryCode, setCountryCode] = useState("IN");
  const [countryName, setCountryName] = useState("India");
  const [stateCode, setStateCode] = useState("");
  const [stateName, setStateName] = useState("");
  const [district, setDistrict] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const countries = Country.getAllCountries();
  const states = State.getStatesOfCountry(countryCode);
  const cities = stateCode ? City.getCitiesOfState(countryCode, stateCode) : [];
  const callingCode = countryCode
    ? getCountryCallingCode(countryCode as Parameters<typeof getCountryCallingCode>[0])
    : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!fullName.trim() || !email.trim() || !password) {
      setFormError("Please provide Full Name, Email, and Password.");
      return;
    }

    if (!address.trim() || !countryName.trim() || !stateName.trim() || !district.trim()) {
      setFormError("Please complete all residential address fields (Address, Country, State, District/City).");
      return;
    }

    const rawPhone = phone.replace(/[^0-9]/g, "");
    if (!rawPhone || (countryCode === "IN" && rawPhone.length !== 10) || (countryCode !== "IN" && rawPhone.length < 7)) {
      setFormError("Please enter a valid phone number (10 digits for India).");
      return;
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      await dataService.createAdmin({
        shop_id: undefined,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password: password,
        address: address.trim(),
        country: countries.find((c) => c.isoCode === countryCode)?.name || countryName,
        state: stateName,
        district: district,
        role: "ADMIN",
        monthly_salary: 0,
      });

      setIsLoading(false);
      navigate("/super-admin/super-admins");
    } catch (err: any) {
      setIsLoading(false);
      setFormError(err?.message || "Failed to create super administrator account.");
    }
  };

  return (
    <SuperAdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={() => navigate("/super-admin/super-admins")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Super Administrators
        </button>

        <div>
          <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
            Create Super Administrator Account
          </h1>
          <p className="text-xs text-slate-500">
            Provision enterprise super admin credentials with full platform and governance permissions
          </p>
        </div>

        {formError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Super Admin Role Badge */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Global System Role:
                </span>
              </div>
              <Badge variant="amber" className="font-bold">
                Platform Administrator (ADMIN)
              </Badge>
            </div>

            {/* Admin Personal Details */}
            <Input
              label="Super Administrator Full Name *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Suresh Kumar"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@chaicraft.in"
                required
              />

              <Input
                label={`Phone Number *${callingCode ? ` (+${callingCode})` : ""}`}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9+ ()-]/g, ""))}
                placeholder={countryCode === "IN" ? "9876500000" : callingCode ? `+${callingCode} 555 000 0000` : "Select a country first"}
                maxLength={countryCode === "IN" ? 10 : undefined}
                required
              />
            </div>

            {/* Address */}
            <Input
              label="Address *"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Headquarters, 100ft Road, Indiranagar, Bangalore"
              required
            />

            {/* Country, State, District/City Datalists */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Input
                  label="Country *"
                  list="superadmin-countries"
                  value={countryName}
                  onChange={(e) => {
                    const value = e.target.value;
                    const selected = countries.find(
                      (item) =>
                        item.name.toLowerCase() === value.toLowerCase() ||
                        item.isoCode.toLowerCase() === value.toLowerCase()
                    );
                    setCountryName(value);
                    setCountryCode(selected?.isoCode || "");
                    setStateCode("");
                    setStateName("");
                    setDistrict("");
                    setPhone("");
                  }}
                  placeholder="Type or select country"
                  required
                />
                <datalist id="superadmin-countries">
                  {countries.map((item) => (
                    <option key={item.isoCode} value={item.name} />
                  ))}
                </datalist>
              </div>

              <div>
                <Input
                  label="State / Province *"
                  list="superadmin-states"
                  value={stateName}
                  onChange={(e) => {
                    const value = e.target.value;
                    const selected = states.find(
                      (item) =>
                        item.name.toLowerCase() === value.toLowerCase() ||
                        item.isoCode.toLowerCase() === value.toLowerCase()
                    );
                    setStateName(value);
                    setStateCode(selected?.isoCode || "");
                    setDistrict("");
                  }}
                  placeholder={countryCode ? "Type or select state" : "Select a country first"}
                  disabled={!countryCode}
                  required
                />
                <datalist id="superadmin-states">
                  {states.map((item) => (
                    <option key={item.isoCode} value={item.name} />
                  ))}
                </datalist>
              </div>

              <div>
                <Input
                  label="District / City *"
                  list="superadmin-cities"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder={stateCode ? "Type or select city" : "Type city name"}
                  required
                />
                <datalist id="superadmin-cities">
                  {cities.map((item) => (
                    <option key={item.name} value={item.name} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                System Login Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create secure password (min 6 characters)"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors pr-10 font-mono"
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
              <p className="text-[11px] text-slate-400 mt-1">
                This password allows the administrator to access the Super Admin control panel.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/super-admin/super-admins")}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading}>
                Create Super Administrator
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default CreateSuperAdminPage;
