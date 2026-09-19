import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { dataService } from "@/services/supabaseService";
import { Shop } from "@/types";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

export const RenewShop: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shop, setShop] = useState<Shop | null>(null);
  const [months, setMonths] = useState(12);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    dataService.getShops().then((shops) => {
      const found = shops.find((s) => s.id === id) || shops[0];
      setShop(found || null);
    });
  }, [id]);

  const handleRenew = () => {
    setSuccess(true);
    setTimeout(() => {
      navigate("/super-admin/shops");
    }, 1500);
  };

  if (!shop) return null;

  return (
    <SuperAdminLayout>
      <div className="max-w-xl mx-auto space-y-6">
        <button
          onClick={() => navigate("/super-admin/shops")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Shops
        </button>

        <div>
          <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
            Renew Franchise Subscription
          </h1>
          <p className="text-xs text-slate-500">
            Extend software license for {shop.name}
          </p>
        </div>

        {success ? (
          <Card className="p-8 text-center space-y-4">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto animate-bounce" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Subscription Successfully Extended!
            </h2>
            <p className="text-xs text-slate-500">
              New license valid until {months} months from current expiry.
            </p>
          </Card>
        ) : (
          <Card className="p-6 space-y-6">
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-500 block">Current Expiry:</span>
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {formatDate(shop.subscription_end_date)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Status:</span>
                <span className="font-bold text-xs text-emerald-600 uppercase">
                  {shop.subscription_status}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Choose Plan Period
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { m: 3, label: "Quarterly", price: "₹2,999" },
                  { m: 6, label: "Half Yearly", price: "₹5,499" },
                  { m: 12, label: "Annual", price: "₹9,999", popular: true },
                ].map((plan) => (
                  <button
                    key={plan.m}
                    type="button"
                    onClick={() => setMonths(plan.m)}
                    className={`p-3.5 rounded-2xl border text-center transition-all ${
                      months === plan.m
                        ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold shadow-sm"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className="text-xs block">{plan.label}</span>
                    <span className="text-sm font-bold block mt-1">{plan.price}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => navigate("/super-admin/shops")} className="flex-1">
                Cancel
              </Button>
              <Button variant="primary" onClick={handleRenew} className="flex-1">
                Confirm & Renew
              </Button>
            </div>
          </Card>
        )}
      </div>
    </SuperAdminLayout>
  );
};
export default RenewShop;
