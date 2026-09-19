import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { dataService } from "@/services/supabaseService";
import { Shop } from "@/types";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Store, Calendar, MapPin, Phone, Mail, FileText, CheckCircle2 } from "lucide-react";

export const ShopDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shop, setShop] = useState<Shop | null>(null);

  useEffect(() => {
    dataService.getShops().then((shops) => {
      const found = shops.find((s) => s.id === id) || shops[0];
      setShop(found || null);
    });
  }, [id]);

  if (!shop) return null;

  return (
    <SuperAdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => navigate("/super-admin/shops")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Shops
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
                {shop.name}
              </h1>
              <Badge variant="success">{shop.subscription_status}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">{shop.tagline}</p>
          </div>

          <div className="flex gap-2">
            <Link to={`/super-admin/shops/${shop.id}/renew`}>
              <Button variant="primary" size="sm">
                Extend / Renew License
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Establishment Info
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-amber-600 mt-0.5" />
                <div>
                  <span className="text-xs text-slate-400 block">Address</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{shop.address || "N/A"}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-amber-600 mt-0.5" />
                <div>
                  <span className="text-xs text-slate-400 block">Phone</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{shop.phone || "N/A"}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-amber-600 mt-0.5" />
                <div>
                  <span className="text-xs text-slate-400 block">Email</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{shop.email || "N/A"}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-amber-600 mt-0.5" />
                <div>
                  <span className="text-xs text-slate-400 block">GST Number</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{shop.gst_number || "Not registered"}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Subscription & POS Config
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-emerald-600 mt-0.5" />
                <div>
                  <span className="text-xs text-slate-400 block">Subscription Expiry</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formatDate(shop.subscription_end_date)}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Store className="w-4 h-4 text-emerald-600 mt-0.5" />
                <div>
                  <span className="text-xs text-slate-400 block">Store Tax Rate</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{shop.tax_rate}% (CGST + SGST)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Receipt Footer Note</span>
                <p className="text-xs italic text-slate-600 dark:text-slate-300 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  "{shop.receipt_footer}"
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
};
export default ShopDetails;
