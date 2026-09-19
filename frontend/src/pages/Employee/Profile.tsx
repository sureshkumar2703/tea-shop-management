import React, { useState } from "react";
import { EmployeeLayout } from "@/layouts/EmployeeLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/stores/authStore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { User, Mail, Phone, Calendar, Clock, CheckCircle2 } from "lucide-react";

export const Profile: React.FC = () => {
  const { user, shop } = useAuthStore();
  const [name, setName] = useState(user?.full_name || "Pooja Verma");
  const [phone, setPhone] = useState(user?.phone || "+91 98451 22334");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <EmployeeLayout>
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
            Staff Profile & Station
          </h1>
          <p className="text-xs text-slate-500">Manage contact information and view attendance record</p>
        </div>

        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xl font-['Outfit']">
              {name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{name}</h2>
              <p className="text-xs text-slate-500">{user?.email}</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="info">BARISTA & CASHIER</Badge>
                <Badge variant="success">ACTIVE</Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-400 block mb-0.5">Assigned Shop:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{shop?.name}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-400 block mb-0.5">Monthly Base Pay:</span>
              <span className="font-bold text-amber-600">{formatCurrency(user?.monthly_salary || 22000)}</span>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <Button type="submit" variant="primary">
              Update Profile
            </Button>

            {saved && (
              <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Changes saved successfully!
              </p>
            )}
          </form>
        </Card>
      </div>
    </EmployeeLayout>
  );
};
export default Profile;
