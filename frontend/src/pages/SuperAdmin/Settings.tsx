import React, { useState } from "react";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Database, ShieldAlert, CheckCircle2 } from "lucide-react";
import { supabaseUrl } from "@/lib/supabase";

export const SuperAdminSettings: React.FC = () => {
  const [platformName, setPlatformName] = useState("ChaiCraft Multi-Tenant Enterprise");
  const [supportEmail, setSupportEmail] = useState("support@chaicraft.in");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SuperAdminLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
            System & Platform Configuration
          </h1>
          <p className="text-xs text-slate-500">Global SaaS infrastructure, database and default parameters</p>
        </div>

        {/* Database & Cloud Endpoint */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Supabase PostgreSQL Backend
              </h2>
              <p className="text-xs text-slate-500">Live active project endpoint</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs font-mono break-all text-slate-600 dark:text-slate-300">
            {supabaseUrl}
          </div>
        </Card>

        {/* Global Settings Form */}
        <Card className="p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Platform Profile
            </h3>
            <Input
              label="Platform Branding"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
            />
            <Input
              label="Support Email"
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
            />

            <div className="pt-2">
              <Button type="submit" variant="primary">
                Save System Settings
              </Button>
            </div>
            {saved && (
              <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1 mt-2">
                <CheckCircle2 className="w-4 h-4" /> Settings updated successfully!
              </p>
            )}
          </form>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};
export default SuperAdminSettings;
