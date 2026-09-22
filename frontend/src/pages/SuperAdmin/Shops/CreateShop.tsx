import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { FileUpload } from "@/components/ui/FileUpload";
import { dataService } from "@/services/supabaseService";
import { Shop } from "@/types";
import { Country, State, City } from "country-state-city";
import { getCountryCallingCode, isValidPhoneNumber } from "libphonenumber-js";
import { ArrowLeft, RefreshCw, QrCode, CheckCircle2, UserPlus, Store } from "lucide-react";

export const CreateShop: React.FC = () => {
  const navigate = useNavigate();

  // Helper to generate auto-shopcode
  const generateShopCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "TEA-";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const [name, setName] = useState("");
  const [shopCode, setShopCode] = useState(generateShopCode());
  const [tagline, setTagline] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("IN");
  const [countryName, setCountryName] = useState("India");
  const [stateCode, setStateCode] = useState("");
  const [stateName, setStateName] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [email, setEmail] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [gpayQrUrl, setGpayQrUrl] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0]
  );
  const [isLifetime, setIsLifetime] = useState(false);
  const [gstNumber, setGstNumber] = useState("");
  const [taxRate, setTaxRate] = useState("5.0");
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Success Modal state to prompt Admin creation
  const [createdShop, setCreatedShop] = useState<Shop | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);

  const countries = Country.getAllCountries();
  const states = State.getStatesOfCountry(countryCode);
  const cities = stateCode ? City.getCitiesOfState(countryCode, stateCode) : [];
  const callingCode = countryCode
    ? getCountryCallingCode(countryCode as Parameters<typeof getCountryCallingCode>[0])
    : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!name || !shopCode || !address || !countryCode || !stateCode || !city || !pincode) {
      setFormError("Please complete all required shop and address fields.");
      return;
    }
    if (!isValidPhoneNumber(phone, countryCode as Parameters<typeof isValidPhoneNumber>[1])) {
      setFormError("Please enter a valid phone number for the selected country.");
      return;
    }
    if (!isLifetime && !expiryDate) {
      setFormError("Please select an expiry date or choose Lifetime.");
      return;
    }
    setIsLoading(true);

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    
    // If gpayQrUrl is empty, generate an automatic UPI QR image based on phone or shop name
    const finalGpayQr =
      gpayQrUrl ||
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2Fpay%3Fpa%3D${encodeURIComponent(
        slug
      )}%40okaxis%26pn%3D${encodeURIComponent(name)}%26cu%3DINR`;

    const newShop = await dataService.createShop({
      name,
      slug,
      shop_code: shopCode,
      tagline,
      address,
      country: countries.find((item) => item.isoCode === countryCode)?.name || countryCode,
      state: stateName,
      city,
      pincode,
      phone,
      email,
      logo_url: imageUrl,
      gpay_qr_url: finalGpayQr,
      start_date: startDate,
      expiry_date: isLifetime ? undefined : expiryDate,
      is_lifetime: isLifetime,
      gst_number: gstNumber,
      tax_rate: parseFloat(taxRate) || 5.0,
      subscription_status: "ACTIVE",
      is_active: isActive,
    });

    setIsLoading(false);
    setCreatedShop(newShop);
    setSuccessModalOpen(true);
  };

  return (
    <SuperAdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => navigate("/super-admin/shops")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Shops
        </button>

        <div>
          <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-2">
            <Store className="w-6 h-6 text-amber-500" />
            Provision New Tea Shop Franchise
          </h1>
          <p className="text-xs text-slate-500">
            Register shop details, auto-generate Shop Code, configure Google Pay QR, and license duration
          </p>
        </div>

        {formError && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</div>}

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-amber-700 dark:text-amber-400 block">Unique Shop Code (Auto-Generated)</span>
                <span className="text-lg font-mono font-black text-amber-900 dark:text-amber-200">{shopCode}</span>
              </div>
              <Button type="button" size="sm" variant="secondary" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => setShopCode(generateShopCode())}>Regenerate Code</Button>
            </div>

            <FileUpload
              label="Shop Image / Logo"
              folder="shops"
              accept="image/*"
              value={imageUrl}
              onChange={setImageUrl}
              helperText="Upload a PNG, JPG, or WebP image."
            />

            {/* Store Address & Contact */}
            <Input
              label="Address *"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Shop #12, 100ft Road, HAL 2nd Stage, Indiranagar, Bangalore"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Country *"
                list="shop-countries"
                value={countryName}
                onChange={(e) => {
                  const value = e.target.value;
                  const selected = countries.find((item) => item.name.toLowerCase() === value.toLowerCase() || item.isoCode.toLowerCase() === value.toLowerCase());
                  setCountryName(value);
                  setCountryCode(selected?.isoCode || "");
                  setStateCode("");
                  setStateName("");
                  setCity("");
                  setPhone("");
                }}
                placeholder="Type or select country"
                required
              />
              <datalist id="shop-countries">
                {countries.map((item) => <option key={item.isoCode} value={item.name} />)}
              </datalist>
              <Input
                label="State *"
                list="shop-states"
                value={stateName}
                onChange={(e) => {
                  const value = e.target.value;
                  const selected = states.find((item) => item.name.toLowerCase() === value.toLowerCase() || item.isoCode.toLowerCase() === value.toLowerCase());
                  setStateCode(selected?.isoCode || "");
                  setStateName(value);
                  setCity("");
                }}
                placeholder={countryCode ? "Type or select state" : "Select a country first"}
                disabled={!countryCode}
                required
              />
              <datalist id="shop-states">
                {states.map((item) => <option key={item.isoCode} value={item.name} />)}
              </datalist>
              <Input
                label="City *"
                list="shop-cities"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={stateCode ? "Type or select city" : "Select a state first"}
                disabled={!stateCode}
                required
              />
              <datalist id="shop-cities">
                {cities.map((item) => <option key={item.name} value={item.name} />)}
              </datalist>
              <Input
                label="Pincode *"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/[^0-9A-Za-z -]/g, ""))}
                placeholder="560038"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={`Phone Number *${callingCode ? ` (+${callingCode})` : ""}`}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9+ ()-]/g, ""))}
                placeholder={countryCode === "IN" ? "9876500000" : callingCode ? `+${callingCode} 555 000 0000` : "Select a country first"}
                maxLength={countryCode === "IN" ? 10 : undefined}
                required
              />
              <Input
                label="Store Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="indiranagar@chaicraft.in"
              />
            </div>

            {/* GPay QR Code Details */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-500" />
                  Google Pay (GPay) / UPI QR Code
                </label>
                <span className="text-[10px] text-slate-400">Used during POS billing</span>
              </div>
              {gpayQrUrl && (
                <div className="flex items-center gap-3 pt-2">
                  <img
                    src={gpayQrUrl}
                    alt="GPay QR Preview"
                    className="w-20 h-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-white object-contain p-1"
                  />
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-emerald-600 block">✓ QR Image Ready</span>
                    Customers will scan this image to pay directly via Google Pay.
                  </div>
                </div>
              )}
              <FileUpload
                label="GPay QR Image"
                folder="shops"
                accept="image/*"
                value={gpayQrUrl}
                onChange={setGpayQrUrl}
                helperText="Upload the QR image customers will scan."
              />
            </div>

            {/* License Duration: Start date, Expiry date or Lifetime */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  License Validity & Term
                </span>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <input
                    type="checkbox"
                    checked={isLifetime}
                    onChange={(e) => setIsLifetime(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500"
                  />
                  <span>Lifetime Access (No Expiry)</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                <Input
                  label="Expiry Date"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  disabled={isLifetime}
                  required={!isLifetime}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Status *</label>
              <select
                value={isActive ? "ACTIVE" : "INACTIVE"}
                onChange={(e) => setIsActive(e.target.value === "ACTIVE")}
                className="w-full sm:w-1/2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            {/* Tax & GSTIN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="GSTIN Number (Optional)"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                placeholder="29ABCDE1234F1Z5"
              />
              <Input
                label="Default GST Tax Rate (%)"
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="5.0"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/super-admin/shops")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading} className="flex-1">
                Save & Provision Shop
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Success Modal to seamlessly trigger Owner/Admin creation */}
      <Modal
        isOpen={successModalOpen}
        onClose={() => {
          setSuccessModalOpen(false);
          navigate("/super-admin/shops");
        }}
        title="Shop Provisioned Successfully!"
        size="md"
      >
        <div className="space-y-4 text-center py-2">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {createdShop?.name}
            </h3>
            <p className="text-xs font-mono font-semibold text-amber-600 mt-0.5">
              Assigned Shop Code: {createdShop?.shop_code}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              The franchise has been registered. Now, create the Store Owner / Admin account to give them access.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">License:</span>
              <span className="font-bold">{createdShop?.is_lifetime ? "Lifetime Access" : `Valid till ${createdShop?.expiry_date}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">GPay Status:</span>
              <span className="font-bold text-emerald-600">Configured with QR</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setSuccessModalOpen(false);
                navigate("/super-admin/shops");
              }}
              className="flex-1"
            >
              Back to Shops
            </Button>
            <Button
              variant="primary"
              icon={<UserPlus className="w-4 h-4" />}
              onClick={() => {
                setSuccessModalOpen(false);
                navigate(`/super-admin/admins/new?shopId=${createdShop?.id}&shopCode=${createdShop?.shop_code}`);
              }}
              className="flex-1"
            >
              Create Shop Admin Now
            </Button>
          </div>
        </div>
      </Modal>
    </SuperAdminLayout>
  );
};
export default CreateShop;
