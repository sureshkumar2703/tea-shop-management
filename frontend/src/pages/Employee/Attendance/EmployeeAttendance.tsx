import React, { useState, useEffect, useMemo } from "react";
import { EmployeeLayout } from "@/layouts/EmployeeLayout";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { dataService } from "@/services/supabaseService";
import { useAuthStore } from "@/stores/authStore";
import { Attendance, AttendanceStatus } from "@/types";
import { formatDate, getLocalDateStr } from "@/lib/utils";
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  Calendar,
  Coffee,
  Check,
  History,
  Timer,
  ChevronLeft,
  ChevronRight,
  Table,
  CalendarDays,
  Search,
  RefreshCw,
} from "lucide-react";

const WEEKDAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const EmployeeAttendance: React.FC = () => {
  const { user, shop } = useAuthStore();
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [historyRecords, setHistoryRecords] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [punching, setPunching] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());

  // History Navigation and View State (strictly for this employee only)
  const [historyViewMode, setHistoryViewMode] = useState<"TABLE" | "CALENDAR">("CALENDAR");
  const [historyMonth, setHistoryMonth] = useState<number>(new Date().getMonth());
  const [historyYear, setHistoryYear] = useState<number>(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const todayStr = getLocalDateStr(new Date());
  const isDoubleWay = shop?.attendance_type === "DOUBLE";

  // Live digital clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadAttendance = async () => {
    if (!shop?.id || !user?.id) return;
    setIsLoading(true);
    try {
      const [todayRecord, myAllRecords] = await Promise.all([
        dataService.getTodayUserAttendance(shop.id, user.id, todayStr),
        dataService.getAttendance(shop.id, undefined, user.id),
      ]);
      setTodayAttendance(todayRecord);
      setHistoryRecords(myAllRecords);
    } catch (err) {
      console.error("Failed to load attendance:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [shop?.id, user?.id]);

  // Single Way: One-Tap Attendance Mark
  const handleSinglePunch = async () => {
    if (!shop?.id || !user?.id) return;
    setPunching(true);
    try {
      const nowIso = new Date().toISOString();
      const rec = await dataService.recordAttendance({
        shop_id: shop.id,
        user_id: user.id,
        date: todayStr,
        in_time: nowIso,
        attendance_category: "PRESENT",
        notes: "Marked via Barista Self-Punch (Single Way)",
      });
      setTodayAttendance(rec);
      await loadAttendance();
    } catch (err) {
      console.error("Single punch error:", err);
    } finally {
      setPunching(false);
    }
  };

  // Double Way: Punch In (In-Time)
  const handlePunchIn = async () => {
    if (!shop?.id || !user?.id) return;
    setPunching(true);
    try {
      const nowIso = new Date().toISOString();
      const rec = await dataService.recordAttendance({
        shop_id: shop.id,
        user_id: user.id,
        date: todayStr,
        in_time: nowIso,
        attendance_category: "PRESENT",
        notes: "Shift Clock In (Double Way)",
      });
      setTodayAttendance(rec);
      await loadAttendance();
    } catch (err) {
      console.error("Clock In error:", err);
    } finally {
      setPunching(false);
    }
  };

  // Double Way: Punch Out (Out-Time)
  const handlePunchOut = async () => {
    if (!shop?.id || !user?.id) return;
    setPunching(true);
    try {
      const nowIso = new Date().toISOString();
      const rec = await dataService.recordAttendance({
        shop_id: shop.id,
        user_id: user.id,
        date: todayStr,
        in_time: todayAttendance?.in_time || todayAttendance?.check_in,
        out_time: nowIso,
        attendance_category: "PRESENT",
        notes: "Shift Clock Out (Double Way)",
      });
      setTodayAttendance(rec);
      await loadAttendance();
    } catch (err) {
      console.error("Clock Out error:", err);
    } finally {
      setPunching(false);
    }
  };

  // Status flags
  const isMarkedToday = !!todayAttendance && (todayAttendance.attendance_category === "PRESENT" || todayAttendance.status === "PRESENT");
  const hasInTime = !!(todayAttendance?.in_time || todayAttendance?.check_in);
  const hasOutTime = !!(todayAttendance?.out_time || todayAttendance?.check_out);

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (historyMonth === 0) {
      setHistoryMonth(11);
      setHistoryYear((y) => y - 1);
    } else {
      setHistoryMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (historyMonth === 11) {
      setHistoryMonth(0);
      setHistoryYear((y) => y + 1);
    } else {
      setHistoryMonth((m) => m + 1);
    }
  };

  const handleCurrentMonth = () => {
    setHistoryMonth(new Date().getMonth());
    setHistoryYear(new Date().getFullYear());
  };

  // Monthly Calendar generator (Strictly for this logged-in employee only)
  const calendarDays = useMemo(() => {
    const totalDays = new Date(historyYear, historyMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(historyYear, historyMonth, 1).getDay();

    const days = [];
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${historyYear}-${String(historyMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isFuture = dateStr > todayStr;
      const isToday = dateStr === todayStr;

      const matchedRecord = historyRecords.find(
        (r) => (r.date === dateStr || r.attendance_date === dateStr)
      );

      const isPresent = !!matchedRecord && (matchedRecord.attendance_category === "PRESENT" || matchedRecord.status === "PRESENT");
      const isAbsent = !isFuture && !isPresent;

      days.push({
        dayNumber: d,
        dateStr,
        isFuture,
        isToday,
        record: matchedRecord,
        isPresent,
        isAbsent,
      });
    }

    return { totalDays, firstDayOfWeek, days };
  }, [historyYear, historyMonth, todayStr, historyRecords]);

  // Monthly Stats (Strictly for this logged-in employee only)
  const monthlyStats = useMemo(() => {
    const presentDays = calendarDays.days.filter((d) => d.isPresent).length;
    const pastDays = calendarDays.days.filter((d) => !d.isFuture).length;
    const absentDays = calendarDays.days.filter((d) => d.isAbsent).length;
    const totalHours = calendarDays.days.reduce((sum, d) => sum + (Number(d.record?.total_hours) || 0), 0);
    const attendanceRate = pastDays > 0 ? Math.round((presentDays / pastDays) * 100) : 0;

    return { presentDays, absentDays, totalHours, attendanceRate, totalDays: calendarDays.totalDays };
  }, [calendarDays]);

  // Monthly Table rows (Strictly for this logged-in employee only)
  const historyTableRows = useMemo(() => {
    const targetMonthPrefix = `${historyYear}-${String(historyMonth + 1).padStart(2, "0")}`;
    const totalDays = new Date(historyYear, historyMonth + 1, 0).getDate();
    const rows: {
      id: string;
      date: string;
      in_time?: string;
      out_time?: string;
      total_hours: number;
      attendance_category: AttendanceStatus;
      notes?: string;
    }[] = [];

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${targetMonthPrefix}-${String(d).padStart(2, "0")}`;
      const isFuture = dateStr > todayStr;

      const matched = historyRecords.find(
        (r) => r.date === dateStr || r.attendance_date === dateStr
      );

      if (matched) {
        const category = (matched.attendance_category || matched.status || "PRESENT") as AttendanceStatus;
        rows.push({
          id: matched.id,
          date: dateStr,
          in_time: matched.in_time || matched.check_in,
          out_time: matched.out_time || matched.check_out,
          total_hours: Number(matched.total_hours) || 0,
          attendance_category: category,
          notes: matched.notes,
        });
      } else if (!isFuture) {
        rows.push({
          id: `absent-${dateStr}`,
          date: dateStr,
          in_time: undefined,
          out_time: undefined,
          total_hours: 0,
          attendance_category: "ABSENT" as AttendanceStatus,
          notes: "Unmarked — Absent",
        });
      }
    }

    rows.sort((a, b) => b.date.localeCompare(a.date));

    return rows.filter((item) => {
      if (statusFilter !== "ALL") {
        if (statusFilter === "PRESENT" && item.attendance_category !== "PRESENT") return false;
        if (statusFilter === "ABSENT" && item.attendance_category !== "ABSENT") return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const dateMatch = item.date.toLowerCase().includes(q);
        const notesMatch = item.notes?.toLowerCase().includes(q);
        if (!dateMatch && !notesMatch) return false;
      }
      return true;
    });
  }, [historyRecords, historyMonth, historyYear, todayStr, statusFilter, searchQuery]);

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
                My Attendance & Shifts
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Store: {shop?.name || "Chai Craft"} &bull; Logged in as: <span className="font-semibold text-slate-700 dark:text-slate-300">{user?.name || user?.full_name || "Employee"}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Store Punch Mode:</span>
            <Badge variant="amber" className="font-semibold text-xs">
              {isDoubleWay ? "Double Way (In & Out Time)" : "Single Way (Daily In Only)"}
            </Badge>
          </div>
        </div>

        {/* Live Attendance Punch Station Card */}
        <Card className="p-6 sm:p-8 border-2 border-amber-300 dark:border-amber-700/60 bg-gradient-to-br from-amber-500/[0.04] via-amber-500/[0.01] to-transparent relative overflow-hidden shadow-md">
          <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none">
            <Coffee className="w-48 h-48 text-amber-600" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                Live Digital Station
              </div>

              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                {currentTime}
              </div>

              <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-center md:justify-start gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>Today: {formatDate(todayStr)}</span>
              </div>
            </div>

            {/* PUNCH ACTION BUTTONS */}
            <div className="w-full md:w-auto flex flex-col items-center sm:items-end gap-3">
              {!isDoubleWay ? (
                /* SINGLE WAY: One Button to Mark Present */
                <div className="w-full sm:w-auto">
                  {isMarkedToday ? (
                    <div className="flex flex-col items-center sm:items-end gap-1.5">
                      <div className="px-6 py-3.5 rounded-2xl bg-emerald-500 text-white font-bold text-sm sm:text-base flex items-center gap-2 shadow-lg shadow-emerald-500/25">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Attendance Marked: PRESENT</span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono">
                        Punched at: {todayAttendance?.in_time ? new Date(todayAttendance.in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }) : "Today"}
                      </span>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full sm:w-auto px-8 py-4 text-base font-bold shadow-xl shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all bg-gradient-to-r from-amber-500 to-amber-600 text-white"
                      disabled={punching}
                      onClick={handleSinglePunch}
                      icon={<CheckCircle2 className="w-5 h-5" />}
                    >
                      {punching ? "Recording Attendance..." : "Mark Present Today"}
                    </Button>
                  )}
                </div>
              ) : (
                /* DOUBLE WAY: In Time & Out Time Buttons */
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  {/* In Time Button */}
                  <div className="w-full sm:w-auto">
                    {hasInTime ? (
                      <div className="px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <div>
                          <div className="text-[10px] uppercase text-emerald-600 font-semibold">Punched In</div>
                          <div className="font-mono text-sm">
                            {new Date(todayAttendance!.in_time || todayAttendance!.check_in!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full sm:w-auto px-6 py-3 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                        disabled={punching}
                        onClick={handlePunchIn}
                        icon={<LogIn className="w-4 h-4" />}
                      >
                        {punching ? "Saving..." : "Clock In (In Time)"}
                      </Button>
                    )}
                  </div>

                  {/* Out Time Button */}
                  <div className="w-full sm:w-auto">
                    {hasOutTime ? (
                      <div className="px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-bold flex items-center gap-2">
                        <Check className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="text-[10px] uppercase text-blue-600 font-semibold">Shift Completed</div>
                          <div className="font-mono text-sm">
                            {new Date(todayAttendance!.out_time || todayAttendance!.check_out!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                            {" "}({todayAttendance?.total_hours || 0} hrs)
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="md"
                        className={`w-full sm:w-auto px-6 py-3 font-bold ${
                          hasInTime
                            ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/20"
                            : "opacity-50 cursor-not-allowed"
                        }`}
                        disabled={!hasInTime || punching}
                        onClick={handlePunchOut}
                        icon={<LogOut className="w-4 h-4" />}
                      >
                        {punching ? "Saving..." : "Clock Out (Out Time)"}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* ======================================================== */}
        {/* ATTENDANCE HISTORY SECTION (FOR THIS LOGGED-IN USER ONLY) */}
        {/* ======================================================== */}
        <div className="space-y-6">
          {/* Controls Bar: Month / Year Navigation & View Mode Toggles */}
          <Card className="p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Month & Year Selectors */}
              <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                {/* Month Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Month
                  </label>
                  <select
                    value={historyMonth}
                    onChange={(e) => setHistoryMonth(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={name} value={idx}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Year
                  </label>
                  <select
                    value={historyYear}
                    onChange={(e) => setHistoryYear(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    {[2024, 2025, 2026, 2027, 2028].map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* VIEW MODE TOGGLE BUTTONS (TABLE & CALENDAR ICONS) */}
              <div className="w-full sm:w-auto flex items-center justify-start sm:justify-end gap-2">
                <div className="flex items-center w-full sm:w-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <button
                    type="button"
                    title="Table View (Data List)"
                    onClick={() => setHistoryViewMode("TABLE")}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                      historyViewMode === "TABLE"
                        ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Table className="w-4 h-4" />
                    <span>Table View</span>
                  </button>

                  <button
                    type="button"
                    title="Monthly Calendar View"
                    onClick={() => setHistoryViewMode("CALENDAR")}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                      historyViewMode === "CALENDAR"
                        ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <CalendarDays className="w-4 h-4" />
                    <span>Monthly Calendar View</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Month Switcher Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 font-['Outfit'] px-1 sm:px-2">
                  {MONTH_NAMES[historyMonth]} {historyYear}
                </span>

                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <Button variant="ghost" size="sm" onClick={handleCurrentMonth} className="text-xs ml-0.5 sm:ml-1 h-8 px-2">
                  This Month
                </Button>
              </div>

              {historyViewMode === "TABLE" && (
                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PRESENT">Present Only</option>
                    <option value="ABSENT">Absent Only</option>
                  </select>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search note/date..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    >
                    </input>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Monthly Metrics Summary Strip */}
          <Card className="p-4 bg-gradient-to-r from-amber-500/[0.05] via-slate-500/[0.02] to-emerald-500/[0.05] border border-amber-200/60 dark:border-amber-800/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-amber-500/20">
                  {user?.name?.charAt(0).toUpperCase() || user?.full_name?.charAt(0).toUpperCase() || "E"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {user?.name || user?.full_name || "My Attendance"}
                    </h3>
                    <Badge variant="neutral" size="sm" className="text-[10px]">
                      {user?.role || "EMPLOYEE"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    My Personal Monthly Ledger &bull; {MONTH_NAMES[historyMonth]} {historyYear}
                  </p>
                </div>
              </div>

              {/* Metric Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  🟢 Present: {monthlyStats.presentDays} Days
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold">
                  🔴 Absent: {monthlyStats.absentDays} Days
                </div>
                {isDoubleWay && (
                  <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold">
                    ⏱ Total: {monthlyStats.totalHours.toFixed(1)} hrs
                  </div>
                )}
                <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-bold">
                  Attendance: {monthlyStats.attendanceRate}%
                </div>
              </div>
            </div>
          </Card>

          {/* VIEW 1: MONTHLY CALENDAR VIEW (FOR THIS LOGGED-IN EMPLOYEE ONLY) */}
          {historyViewMode === "CALENDAR" && (
            <Card className="p-3 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
              {/* Mobile Swipe Hint */}
              <div className="sm:hidden flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-2.5 px-0.5">
                <span className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/50 dark:border-amber-900/40">
                  <span>👉</span> Swipe horizontally to view full week
                </span>
                <span className="text-[10px] text-slate-400">Sun &ndash; Sat</span>
              </div>

              {/* Responsive Scrollable Calendar Container */}
              <div className="overflow-x-auto pb-3 -mx-1 px-1 sm:mx-0 sm:px-0 scrollbar-thin">
                <div className="min-w-[680px]">
                  {/* Weekday Header */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {WEEKDAY_NAMES.map((wd) => (
                      <div
                        key={wd}
                        className="text-center py-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/60 rounded-lg"
                      >
                        {wd}
                      </div>
                    ))}
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {/* Padding cells before the 1st of the month */}
                    {Array.from({ length: calendarDays.firstDayOfWeek }).map((_, idx) => (
                      <div
                        key={`pad-${idx}`}
                        className="min-h-[90px] sm:min-h-[105px] h-auto rounded-xl bg-slate-50/50 dark:bg-slate-900/30 opacity-40 border border-dashed border-slate-200 dark:border-slate-800"
                      />
                    ))}

                    {/* Day Cells */}
                    {calendarDays.days.map((d) => {
                      return (
                        <div
                          key={d.dateStr}
                          className={`min-h-[90px] sm:min-h-[105px] h-auto p-2 rounded-xl border flex flex-col justify-between overflow-hidden transition-all select-none ${
                            d.isToday ? "ring-2 ring-amber-500 shadow-sm" : ""
                          } ${
                            d.isFuture
                              ? "bg-slate-50/40 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800 text-slate-400"
                              : d.isPresent
                              ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100"
                              : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/60 text-rose-950 dark:text-rose-100"
                          }`}
                        >
                          {/* Top Row: Date Number & Today marker */}
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs sm:text-sm font-bold font-mono ${
                                d.isToday
                                  ? "w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs shadow-sm"
                                  : ""
                              }`}
                            >
                              {d.dayNumber}
                            </span>

                            {d.isToday && (
                              <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                                Today
                              </span>
                            )}
                          </div>

                          {/* Content: Present vs Absent */}
                          <div className="space-y-1 w-full overflow-hidden">
                            {d.isFuture ? (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 italic block">
                                Upcoming
                              </span>
                            ) : d.isPresent ? (
                              <div className="w-full">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 max-w-full">
                                  <Check className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate">PRESENT</span>
                                </span>

                                {d.record?.in_time && (
                                  <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 truncate mt-0.5 font-medium">
                                    In: {new Date(d.record.in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                                  </div>
                                )}

                                {isDoubleWay && d.record?.out_time && (
                                  <div className="text-[10px] font-mono text-blue-700 dark:text-blue-300 truncate font-medium">
                                    Out: {new Date(d.record.out_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                                  </div>
                                )}

                                {isDoubleWay && Number(d.record?.total_hours) > 0 && (
                                  <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300 truncate">
                                    ⏱ {d.record?.total_hours} hrs
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-full">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 max-w-full">
                                  <XCircle className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate">ABSENT</span>
                                </span>
                                <span className="text-[10px] text-rose-600 dark:text-rose-400 block mt-0.5 truncate font-medium">
                                  No Punch
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* VIEW 2: TABLE VIEW (FOR THIS LOGGED-IN EMPLOYEE ONLY) */}
          {historyViewMode === "TABLE" && (
            <Card className="overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200 font-['Outfit']">
                    My Attendance Ledger — {MONTH_NAMES[historyMonth]} {historyYear}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({historyTableRows.length} days recorded)
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadAttendance}
                  icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />}
                  className="text-xs"
                >
                  Refresh
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Attendance Status</th>
                      <th className="py-3 px-4">{isDoubleWay ? "In Time" : "Marked Present Time"}</th>
                      {isDoubleWay && <th className="py-3 px-4">Out Time</th>}
                      {isDoubleWay && <th className="py-3 px-4">Shift Duration</th>}
                      <th className="py-3 px-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                    {isLoading ? (
                      <tr>
                        <td colSpan={isDoubleWay ? 6 : 4} className="py-10 text-center text-slate-400">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
                          Loading your attendance logs...
                        </td>
                      </tr>
                    ) : historyTableRows.length === 0 ? (
                      <tr>
                        <td colSpan={isDoubleWay ? 6 : 4} className="py-10 text-center text-slate-400">
                          No attendance records found for this period.
                        </td>
                      </tr>
                    ) : (
                      historyTableRows.map((item) => {
                        const isPresent = item.attendance_category === "PRESENT";
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-semibold text-xs text-slate-900 dark:text-white">
                              {formatDate(item.date)}
                            </td>
                            <td className="py-3.5 px-4">
                              {isPresent ? (
                                <Badge variant="success" size="sm" className="font-bold gap-1">
                                  <Check className="w-3 h-3" />
                                  PRESENT
                                </Badge>
                              ) : (
                                <Badge variant="danger" size="sm" className="font-bold gap-1">
                                  <XCircle className="w-3 h-3" />
                                  ABSENT
                                </Badge>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                              {item.in_time ? (
                                new Date(item.in_time).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })
                              ) : (
                                <span className="text-slate-400 italic">--</span>
                              )}
                            </td>
                            {isDoubleWay && (
                              <td className="py-3.5 px-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                                {item.out_time ? (
                                  new Date(item.out_time).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })
                                ) : (
                                  <span className="text-slate-400 italic">--</span>
                                )}
                              </td>
                            )}
                            {isDoubleWay && (
                              <td className="py-3.5 px-4 font-bold text-xs text-slate-800 dark:text-slate-200">
                                {item.total_hours > 0 ? `${item.total_hours} hrs` : "--"}
                              </td>
                            )}
                            <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 italic">
                              {item.notes || "--"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeAttendance;
