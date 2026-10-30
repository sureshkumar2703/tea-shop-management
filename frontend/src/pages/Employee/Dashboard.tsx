import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { EmployeeLayout } from "@/layouts/EmployeeLayout";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/stores/authStore";
import { useRegisterStore } from "@/stores/registerStore";
import { dataService } from "@/services/supabaseService";
import { Attendance } from "@/types";
import { formatCurrency, formatDate, getLocalDateStr } from "@/lib/utils";
import {
  Receipt,
  Banknote,
  Coffee,
  Clock,
  ArrowRight,
  User,
  BarChart2,
  CalendarCheck,
  CheckCircle2,
  LogIn,
  LogOut,
  Sparkles,
} from "lucide-react";

export const EmployeeDashboard: React.FC = () => {
  const { user, shop } = useAuthStore();
  const { currentRegister, isOpen } = useRegisterStore();
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [punching, setPunching] = useState<boolean>(false);

  const todayStr = getLocalDateStr(new Date());
  const isDoubleWay = shop?.attendance_type === "DOUBLE";

  const loadTodayAttendance = async () => {
    if (!shop?.id || !user?.id) return;
    try {
      const record = await dataService.getTodayUserAttendance(shop.id, user.id, todayStr);
      setTodayAttendance(record);
    } catch (e) {
      console.warn("Failed to load today's attendance:", e);
    }
  };

  useEffect(() => {
    loadTodayAttendance();
  }, [shop?.id, user?.id]);

  const handleSinglePunch = async () => {
    if (!shop?.id || !user?.id) return;
    setPunching(true);
    try {
      const rec = await dataService.recordAttendance({
        shop_id: shop.id,
        user_id: user.id,
        date: todayStr,
        in_time: new Date().toISOString(),
        attendance_category: "PRESENT",
        notes: "Marked via Barista Dashboard (Single Way)",
      });
      setTodayAttendance(rec);
    } catch (e) {
      console.error("Attendance punch error:", e);
    } finally {
      setPunching(false);
    }
  };

  const handlePunchIn = async () => {
    if (!shop?.id || !user?.id) return;
    setPunching(true);
    try {
      const rec = await dataService.recordAttendance({
        shop_id: shop.id,
        user_id: user.id,
        date: todayStr,
        in_time: new Date().toISOString(),
        attendance_category: "PRESENT",
        notes: "Shift Clock In (Double Way)",
      });
      setTodayAttendance(rec);
    } catch (e) {
      console.error("Clock In error:", e);
    } finally {
      setPunching(false);
    }
  };

  const handlePunchOut = async () => {
    if (!shop?.id || !user?.id) return;
    setPunching(true);
    try {
      const rec = await dataService.recordAttendance({
        shop_id: shop.id,
        user_id: user.id,
        date: todayStr,
        in_time: todayAttendance?.in_time || todayAttendance?.check_in,
        out_time: new Date().toISOString(),
        attendance_category: "PRESENT",
        notes: "Shift Clock Out (Double Way)",
      });
      setTodayAttendance(rec);
    } catch (e) {
      console.error("Clock Out error:", e);
    } finally {
      setPunching(false);
    }
  };

  const isMarked = !!todayAttendance && (todayAttendance.attendance_category === "PRESENT" || todayAttendance.status === "PRESENT");
  const hasInTime = !!(todayAttendance?.in_time || todayAttendance?.check_in);
  const hasOutTime = !!(todayAttendance?.out_time || todayAttendance?.check_out);

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
              Welcome back, {user?.full_name || "Barista"}!
            </h1>
            <p className="text-xs text-slate-500">
              Station: {shop?.name || "Chai Craft Artisan Bar"} &bull; Counter POS Terminal
            </p>
          </div>

          <Link to="/employee/billing">
            <Button variant="primary" size="lg" icon={<Receipt className="w-5 h-5" />}>
              Open POS Billing
            </Button>
          </Link>
        </div>

        {/* Daily Attendance Card */}
        <Card className="p-4 sm:p-5 border-2 border-amber-300 dark:border-amber-700/60 bg-gradient-to-r from-amber-500/[0.08] via-amber-500/[0.02] to-transparent shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Daily Staff Attendance
                  </h3>
                  <Badge variant="neutral" size="sm" className="text-[10px]">
                    {isDoubleWay ? "Double Way (In & Out)" : "Single Way (1-Tap)"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Today: {formatDate(todayStr)} &bull;{" "}
                  {isMarked ? "Attendance registered for shift" : "Not yet punched in today"}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              {!isDoubleWay ? (
                /* SINGLE WAY */
                isMarked ? (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Present (Punched {new Date(todayAttendance!.in_time || todayAttendance!.check_in!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })})</span>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={punching}
                    onClick={handleSinglePunch}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    className="font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/25"
                  >
                    {punching ? "Recording..." : "Mark Present"}
                  </Button>
                )
              ) : (
                /* DOUBLE WAY */
                <div className="flex items-center gap-2">
                  {!hasInTime ? (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={punching}
                      onClick={handlePunchIn}
                      icon={<LogIn className="w-4 h-4" />}
                      className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {punching ? "Saving..." : "Clock In"}
                    </Button>
                  ) : (
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold font-mono">
                      In: {new Date(todayAttendance!.in_time || todayAttendance!.check_in!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                    </div>
                  )}

                  {!hasOutTime ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasInTime || punching}
                      onClick={handlePunchOut}
                      icon={<LogOut className="w-4 h-4" />}
                      className={`font-bold ${hasInTime ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500" : "opacity-50"}`}
                    >
                      {punching ? "Saving..." : "Clock Out"}
                    </Button>
                  ) : (
                    <div className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-bold font-mono">
                      Out: {new Date(todayAttendance!.out_time || todayAttendance!.check_out!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })} ({todayAttendance?.total_hours || 0} hrs)
                    </div>
                  )}
                </div>
              )}

              <Link to="/employee/attendance">
                <Button variant="ghost" size="sm" className="text-xs">
                  Full Log <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Shift Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard
            title="Active Shift Sales"
            value={formatCurrency((currentRegister.cash_sales || 0) + (currentRegister.upi_sales || 0))}
            icon={<Coffee className="w-5 h-5" />}
            subtitle="Today's processed tickets"
            color="amber"
          />
          <StatCard
            title="Drawer Cash On-Hand"
            value={formatCurrency(currentRegister.expected_cash || 0)}
            icon={<Banknote className="w-5 h-5" />}
            subtitle={`Float: ${formatCurrency(currentRegister.opening_float)}`}
            color="emerald"
          />
          <StatCard
            title="Shift Status"
            value={isOpen ? "CLOCK ACTIVE" : "TILL CLOSED"}
            icon={<Clock className="w-5 h-5" />}
            subtitle="Check-in verified"
            color="blue"
          />
        </div>

        {/* Quick Action Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 space-y-3 hover:border-amber-400 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Counter POS Billing
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fast tea orders, Regular/Thirsty sizes, and Split payments
                </p>
              </div>
            </div>
            <Link to="/employee/billing" className="block pt-2">
              <Button variant="primary" size="sm" className="w-full">
                Launch POS <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </Card>

          <Card className="p-5 space-y-3 hover:border-emerald-400 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  My Attendance
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Clock in/out times, monthly hours, and punch ledger
                </p>
              </div>
            </div>
            <Link to="/employee/attendance" className="block pt-2">
              <Button variant="outline" size="sm" className="w-full">
                My Attendance <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </Card>

          <Card className="p-5 space-y-3 hover:border-blue-400 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/30">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Bills & Expenses Report
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Day, Week, and Month reports for receipts and daily shop spends
                </p>
              </div>
            </div>
            <Link to="/employee/reports" className="block pt-2">
              <Button variant="outline" size="sm" className="w-full">
                View Reports <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </Card>

          <Card className="p-5 space-y-3 hover:border-purple-400 transition-colors flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-md shadow-purple-500/30">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  My Salary Report
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Contracted salary, monthly disbursements, and pay slips
                </p>
              </div>
            </div>
            <Link to="/employee/salary" className="block pt-2">
              <Button variant="secondary" size="sm" className="w-full">
                Salary Ledger <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeDashboard;
