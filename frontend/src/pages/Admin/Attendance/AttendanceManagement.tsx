import React, { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { dataService } from "@/services/supabaseService";
import { useAuthStore } from "@/stores/authStore";
import { Attendance, Profile, AttendanceStatus } from "@/types";
import { formatDate, formatDateTime, getLocalDateStr } from "@/lib/utils";
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Calendar,
  Users,
  UserCheck,
  UserX,
  Download,
  RefreshCw,
  Printer,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  Edit3,
  Check,
  ShieldCheck,
  Table,
  List,
  CalendarDays,
  Timer,
  AlertCircle,
  Coffee,
} from "lucide-react";

interface MergedAttendanceItem {
  id: string;
  employee: Profile;
  user_id: string;
  date: string;
  in_time?: string;
  out_time?: string;
  total_hours: number;
  attendance_category: AttendanceStatus;
  status: AttendanceStatus;
  isMarked: boolean;
  notes?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const AttendanceManagement: React.FC = () => {
  const { shop, user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"PUNCH_STATION" | "HISTORY">("PUNCH_STATION");

  // History Sub-view: Table or Monthly Calendar
  const [historyViewMode, setHistoryViewMode] = useState<"TABLE" | "CALENDAR">("TABLE");

  // Data State
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [allRecords, setAllRecords] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // History Filters
  const [selectedUserId, setSelectedUserId] = useState<string>("ALL");
  const [calendarUserId, setCalendarUserId] = useState<string>("");
  const [historyMonth, setHistoryMonth] = useState<number>(new Date().getMonth());
  const [historyYear, setHistoryYear] = useState<number>(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Live Digital Clock
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());

  // Edit / Custom Punch Modal State (Used in Punch Station tab)
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<MergedAttendanceItem | null>(null);
  const [modalInTime, setModalInTime] = useState<string>("");
  const [modalOutTime, setModalOutTime] = useState<string>("");
  const [modalCategory, setModalCategory] = useState<AttendanceStatus>("PRESENT");
  const [modalNotes, setModalNotes] = useState<string>("");

  const todayStr = getLocalDateStr(new Date());
  const isDoubleWay = shop?.attendance_type === "DOUBLE";

  // Clock tick
  useEffect(() => {
    const t = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Load shop employees and complete attendance history for the shop
  const loadData = async () => {
    if (!shop?.id) return;
    setIsLoading(true);
    try {
      const [allEmps, recordsList] = await Promise.all([
        dataService.getEmployees(shop.id),
        dataService.getAttendance(shop.id),
      ]);
      setEmployees(allEmps);
      setAllRecords(recordsList);
    } catch (err) {
      console.error("Error loading attendance data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shop?.id]);

  // Today's Live Roster (for Tab 1: Daily Punch Station)
  const todayLiveRoster: MergedAttendanceItem[] = useMemo(() => {
    return employees.map((emp) => {
      const matched = allRecords.find(
        (r) =>
          (r.user_id === emp.id || r.employee_id === emp.id) &&
          (r.date === todayStr || r.attendance_date === todayStr)
      );

      if (matched) {
        const category = (matched.attendance_category || matched.status || "PRESENT") as AttendanceStatus;
        return {
          id: matched.id,
          employee: emp,
          user_id: emp.id,
          date: todayStr,
          in_time: matched.in_time || matched.check_in,
          out_time: matched.out_time || matched.check_out,
          total_hours: Number(matched.total_hours) || 0,
          attendance_category: category,
          status: category,
          isMarked: true,
          notes: matched.notes,
        };
      }

      return {
        id: `unmarked-${emp.id}-${todayStr}`,
        employee: emp,
        user_id: emp.id,
        date: todayStr,
        in_time: undefined,
        out_time: undefined,
        total_hours: 0,
        attendance_category: "ABSENT" as AttendanceStatus,
        status: "ABSENT" as AttendanceStatus,
        isMarked: false,
        notes: "Not marked today",
      };
    });
  }, [employees, allRecords, todayStr]);

  // Admin / Owner's personal record for today
  const myTodayRecord = useMemo(() => {
    if (!currentUser?.id) return null;
    return todayLiveRoster.find((m) => m.user_id === currentUser.id) || null;
  }, [todayLiveRoster, currentUser?.id]);

  // Selected User Object (for History / Calendar)
  const selectedUserObj = useMemo(() => {
    const targetId = historyViewMode === "CALENDAR"
      ? (calendarUserId || currentUser?.id || employees[0]?.id)
      : selectedUserId;
    if (!targetId || targetId === "ALL") return null;
    return employees.find((e) => e.id === targetId) || null;
  }, [employees, selectedUserId, calendarUserId, historyViewMode, currentUser?.id]);

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

  // Month days generator for the calendar
  const calendarDays = useMemo(() => {
    const totalDays = new Date(historyYear, historyMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(historyYear, historyMonth, 1).getDay();
    const activeCalId = calendarUserId || currentUser?.id || employees[0]?.id;

    const days = [];
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${historyYear}-${String(historyMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isFuture = dateStr > todayStr;
      const isToday = dateStr === todayStr;

      // Find record for the active calendar user
      let matchedRecord: Attendance | undefined = undefined;
      if (activeCalId) {
        matchedRecord = allRecords.find(
          (r) =>
            (r.user_id === activeCalId || r.employee_id === activeCalId) &&
            (r.date === dateStr || r.attendance_date === dateStr)
        );
      }

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
  }, [historyYear, historyMonth, todayStr, calendarUserId, currentUser?.id, employees, allRecords]);

  // Monthly stats for the selected user
  const monthlyStats = useMemo(() => {
    const presentDays = calendarDays.days.filter((d) => d.isPresent).length;
    const pastDays = calendarDays.days.filter((d) => !d.isFuture).length;
    const absentDays = calendarDays.days.filter((d) => d.isAbsent).length;
    const totalHours = calendarDays.days.reduce((sum, d) => sum + (Number(d.record?.total_hours) || 0), 0);
    const attendanceRate = pastDays > 0 ? Math.round((presentDays / pastDays) * 100) : 0;

    return { presentDays, absentDays, totalHours, attendanceRate, totalDays: calendarDays.totalDays };
  }, [calendarDays]);

  // History Table rows: Filtered by Selected User, Month, and Status
  const historyTableRows = useMemo(() => {
    const targetMonthPrefix = `${historyYear}-${String(historyMonth + 1).padStart(2, "0")}`;

    // Filter roster employees
    const targetEmployees = selectedUserId === "ALL" ? employees : employees.filter((e) => e.id === selectedUserId);

    // Days in the month up to today (or all days in the month)
    const rows: MergedAttendanceItem[] = [];
    const totalDays = new Date(historyYear, historyMonth + 1, 0).getDate();

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${targetMonthPrefix}-${String(d).padStart(2, "0")}`;
      const isFuture = dateStr > todayStr;

      targetEmployees.forEach((emp) => {
        const matched = allRecords.find(
          (r) =>
            (r.user_id === emp.id || r.employee_id === emp.id) &&
            (r.date === dateStr || r.attendance_date === dateStr)
        );

        if (matched) {
          const category = (matched.attendance_category || matched.status || "PRESENT") as AttendanceStatus;
          rows.push({
            id: matched.id,
            employee: emp,
            user_id: emp.id,
            date: dateStr,
            in_time: matched.in_time || matched.check_in,
            out_time: matched.out_time || matched.check_out,
            total_hours: Number(matched.total_hours) || 0,
            attendance_category: category,
            status: category,
            isMarked: true,
            notes: matched.notes,
          });
        } else if (!isFuture) {
          // Past unmarked day is ABSENT
          rows.push({
            id: `hist-absent-${emp.id}-${dateStr}`,
            employee: emp,
            user_id: emp.id,
            date: dateStr,
            in_time: undefined,
            out_time: undefined,
            total_hours: 0,
            attendance_category: "ABSENT",
            status: "ABSENT",
            isMarked: false,
            notes: "Unmarked — Recorded as Absent",
          });
        }
      });
    }

    // Sort by date descending
    rows.sort((a, b) => b.date.localeCompare(a.date));

    // Filter by status and search
    return rows.filter((item) => {
      if (statusFilter !== "ALL") {
        if (statusFilter === "PRESENT" && item.attendance_category !== "PRESENT") return false;
        if (statusFilter === "ABSENT" && item.attendance_category !== "ABSENT") return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = item.employee.full_name?.toLowerCase().includes(q);
        const emailMatch = item.employee.email?.toLowerCase().includes(q);
        if (!nameMatch && !emailMatch) return false;
      }

      return true;
    });
  }, [employees, allRecords, selectedUserId, historyMonth, historyYear, todayStr, statusFilter, searchQuery]);

  // Punch actions for Punch Station tab
  const handleMarkPresent = async (empId: string) => {
    if (!shop?.id) return;
    setActionLoadingId(empId);
    try {
      const nowIso = new Date().toISOString();
      await dataService.recordAttendance({
        shop_id: shop.id,
        user_id: empId,
        date: todayStr,
        in_time: nowIso,
        attendance_category: "PRESENT",
        notes: "Marked present by Shop Admin",
      });
      await loadData();
    } catch (err) {
      console.error("Failed to mark present:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkAbsent = async (empId: string) => {
    if (!shop?.id) return;
    setActionLoadingId(empId);
    try {
      await dataService.recordAttendance({
        shop_id: shop.id,
        user_id: empId,
        date: todayStr,
        attendance_category: "ABSENT",
        notes: "Marked absent by Shop Admin",
      });
      await loadData();
    } catch (err) {
      console.error("Failed to mark absent:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePunchIn = async (empId: string) => {
    if (!shop?.id) return;
    setActionLoadingId(empId);
    try {
      const nowIso = new Date().toISOString();
      await dataService.recordAttendance({
        shop_id: shop.id,
        user_id: empId,
        date: todayStr,
        in_time: nowIso,
        attendance_category: "PRESENT",
        notes: "Shift In-Time Recorded",
      });
      await loadData();
    } catch (err) {
      console.error("Failed to clock in:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePunchOut = async (item: MergedAttendanceItem) => {
    if (!shop?.id) return;
    setActionLoadingId(item.user_id);
    try {
      const nowIso = new Date().toISOString();
      await dataService.recordAttendance({
        shop_id: shop.id,
        user_id: item.user_id,
        date: item.date,
        in_time: item.in_time || nowIso,
        out_time: nowIso,
        attendance_category: "PRESENT",
        notes: item.notes || "Shift Out-Time Completed",
      });
      await loadData();
    } catch (err) {
      console.error("Failed to clock out:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const openEditModal = (item: MergedAttendanceItem) => {
    setEditingItem(item);
    setModalCategory(item.attendance_category);
    setModalNotes(item.notes || "");

    if (item.in_time) {
      const d = new Date(item.in_time);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      setModalInTime(`${hh}:${mm}`);
    } else {
      setModalInTime("09:00");
    }

    if (item.out_time) {
      const d = new Date(item.out_time);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      setModalOutTime(`${hh}:${mm}`);
    } else {
      setModalOutTime("18:00");
    }

    setEditModalOpen(true);
  };

  const handleSaveModal = async () => {
    if (!shop?.id || !editingItem) return;
    setActionLoadingId(editingItem.user_id);
    try {
      let finalInIso: string | undefined = undefined;
      let finalOutIso: string | undefined = undefined;

      if (modalCategory === "PRESENT") {
        if (modalInTime) {
          const [h, m] = modalInTime.split(":");
          const d = new Date(editingItem.date);
          d.setHours(parseInt(h, 10), parseInt(m, 10), 0);
          finalInIso = d.toISOString();
        }
        if (isDoubleWay && modalOutTime) {
          const [h, m] = modalOutTime.split(":");
          const d = new Date(editingItem.date);
          d.setHours(parseInt(h, 10), parseInt(m, 10), 0);
          finalOutIso = d.toISOString();
        }
      }

      await dataService.recordAttendance({
        shop_id: shop.id,
        user_id: editingItem.user_id,
        date: editingItem.date,
        in_time: finalInIso,
        out_time: finalOutIso,
        attendance_category: modalCategory,
        notes: modalNotes,
      });

      setEditModalOpen(false);
      await loadData();
    } catch (err) {
      console.error("Save edit error:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const listToExport = historyTableRows;
    if (listToExport.length === 0) return;

    const headers = [
      "Staff Name",
      "Email",
      "Role",
      "Date",
      "Punch Mode",
      "Status",
      "In Time",
      "Out Time",
      "Total Hours",
      "Notes",
    ];

    const rows = listToExport.map((item) => [
      `"${item.employee.full_name || "Staff"}"`,
      `"${item.employee.email || ""}"`,
      `"${item.employee.role || ""}"`,
      `"${item.date}"`,
      `"${isDoubleWay ? "Double Way" : "Single Way"}"`,
      `"${item.attendance_category}"`,
      `"${item.in_time ? formatDateTime(item.in_time) : "--"}"`,
      `"${item.out_time ? formatDateTime(item.out_time) : "--"}"`,
      `"${item.total_hours || 0}"`,
      `"${item.notes || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_${selectedUserObj?.full_name || "Staff"}_${MONTH_NAMES[historyMonth]}_${historyYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-sm">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
                Staff & Owner Attendance Portal
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Store: {shop?.name || "Artisan Chai Store"} &bull; Live Punch Station & Audit History
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30 flex items-center gap-2">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Store Mode:
              </span>
              <Badge variant="neutral" className="text-xs font-semibold">
                {isDoubleWay ? "Double Way (In & Out Time)" : "Single Way (1-Tap Present)"}
              </Badge>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              icon={<Download className="w-4 h-4" />}
            >
              Export (.CSV)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              icon={<Printer className="w-4 h-4" />}
            >
              Print
            </Button>
          </div>
        </div>

        {/* Tab Switcher: Daily Punch Station vs History Logs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab("PUNCH_STATION")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === "PUNCH_STATION"
                ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Daily Punch Station (Mark Attendance)</span>
          </button>

          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === "HISTORY"
                ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Attendance History & Logs</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: DAILY PUNCH STATION (LIVE ATTENDANCE PUNCHING)   */}
        {/* ======================================================== */}
        {activeTab === "PUNCH_STATION" && (
          <div className="space-y-6">
            {/* Top Metric Summary Cards for Today */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Roster Staff"
                value={employees.length.toString()}
                icon={<Users className="w-5 h-5" />}
                subtitle="Registered employees & owners"
                color="amber"
              />
              <StatCard
                title="Present Today"
                value={todayLiveRoster.filter((i) => i.attendance_category === "PRESENT").length.toString()}
                icon={<UserCheck className="w-5 h-5" />}
                subtitle="Punched in today"
                color="emerald"
              />
              <StatCard
                title="Absent Today"
                value={todayLiveRoster.filter((i) => i.attendance_category === "ABSENT").length.toString()}
                icon={<UserX className="w-5 h-5" />}
                subtitle="Not yet punched"
                color="rose"
              />
              <StatCard
                title="Attendance System"
                value={isDoubleWay ? "Double Way" : "Single Way"}
                icon={<Clock className="w-5 h-5" />}
                subtitle={isDoubleWay ? "In Time + Out Time Punch" : "One-Tap Daily Attendance"}
                color="blue"
              />
            </div>

            {/* Today's Live Staff & Owner Punch Table */}
            <Card className="overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200 font-['Outfit']">
                    Live Staff Punch Station — Today: {formatDate(todayStr)}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({todayLiveRoster.length} staff & owners)
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
                    <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    <span>{currentTime}</span>
                  </div>

                  <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadData}
                  icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />}
                  className="text-xs"
                >
                  Refresh Live Status
                </Button>
              </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Staff Member</th>
                      <th className="py-3 px-4">Current Status</th>
                      <th className="py-3 px-4">{isDoubleWay ? "In Time" : "Marked Present Time"}</th>
                      {isDoubleWay && <th className="py-3 px-4">Out Time</th>}
                      {isDoubleWay && <th className="py-3 px-4">Shift Duration</th>}
                      <th className="py-3 px-4 text-right">Punch Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                    {todayLiveRoster.map((item) => {
                      const isPresent = item.attendance_category === "PRESENT";
                      const isOnShift = isPresent && !!item.in_time && !item.out_time;
                      const isCompleted = isPresent && !!item.in_time && !!item.out_time;
                      const isActionLoading = actionLoadingId === item.user_id;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${
                                  isPresent
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                }`}
                              >
                                {item.employee.full_name?.charAt(0).toUpperCase() || "E"}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 dark:text-white">
                                    {item.employee.full_name}
                                  </span>
                                  <Badge variant="neutral" size="sm" className="text-[10px]">
                                    {item.employee.role}
                                  </Badge>
                                </div>
                                <span className="text-xs text-slate-400 block">
                                  {item.employee.email} {item.employee.phone ? `• ${item.employee.phone}` : ""}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {!isPresent ? (
                              <Badge variant="danger" size="sm" className="font-bold gap-1">
                                <XCircle className="w-3.5 h-3.5" />
                                ABSENT (Not Marked)
                              </Badge>
                            ) : isDoubleWay && isOnShift ? (
                              <Badge variant="warning" size="sm" className="font-bold gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-300/40">
                                <Clock className="w-3.5 h-3.5 animate-pulse" />
                                ON SHIFT
                              </Badge>
                            ) : isDoubleWay && isCompleted ? (
                              <Badge variant="info" size="sm" className="font-bold gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                SHIFT DONE
                              </Badge>
                            ) : (
                              <Badge variant="success" size="sm" className="font-bold gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                PRESENT
                              </Badge>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-xs">
                            {item.in_time ? (
                              <span className="text-slate-800 dark:text-slate-200 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                {new Date(item.in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">--</span>
                            )}
                          </td>

                          {isDoubleWay && (
                            <td className="py-3.5 px-4 font-mono text-xs">
                              {item.out_time ? (
                                <span className="text-slate-800 dark:text-slate-200 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                  {new Date(item.out_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                                </span>
                              ) : isOnShift ? (
                                <span className="text-amber-600 dark:text-amber-400 font-bold text-xs bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200/50">
                                  Active (Working)
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">--</span>
                              )}
                            </td>
                          )}

                          {isDoubleWay && (
                            <td className="py-3.5 px-4 text-xs">
                              {item.total_hours > 0 ? (
                                <span className="font-bold text-slate-900 dark:text-white bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-200/50">
                                  {item.total_hours} hrs
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">0 hrs</span>
                              )}
                            </td>
                          )}

                          {/* PUNCH ACTIONS COLUMN */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!isDoubleWay ? (
                                isPresent ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                                    disabled={isActionLoading}
                                    onClick={() => handleMarkAbsent(item.user_id)}
                                  >
                                    Mark Absent
                                  </Button>
                                ) : (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                    disabled={isActionLoading}
                                    onClick={() => handleMarkPresent(item.user_id)}
                                  >
                                    Mark Present
                                  </Button>
                                )
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  {!item.in_time ? (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                      disabled={isActionLoading}
                                      onClick={() => handlePunchIn(item.user_id)}
                                      icon={<LogIn className="w-3.5 h-3.5" />}
                                    >
                                      {isActionLoading ? "Saving..." : "Punch In (In Time)"}
                                    </Button>
                                  ) : !item.out_time ? (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/20"
                                      disabled={isActionLoading}
                                      onClick={() => handlePunchOut(item)}
                                      icon={<LogOut className="w-3.5 h-3.5" />}
                                    >
                                      {isActionLoading ? "Saving..." : "Punch Out (Out Time)"}
                                    </Button>
                                  ) : (
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-md border border-emerald-200">
                                      ✓ Completed
                                    </span>
                                  )}

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs p-1.5 text-slate-600 hover:text-amber-600"
                                    title="Edit In/Out Times"
                                    onClick={() => openEditModal(item)}
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
            </Card>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: ATTENDANCE HISTORY & LOGS                        */}
        {/* ======================================================== */}
        {activeTab === "HISTORY" && (
          <div className="space-y-6">
            {/* Filter and View Switcher Card */}
            <Card className="p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                {/* User & Month Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full lg:w-auto flex-1">
                  {/* 1. Selected User / Staff Member */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      {historyViewMode === "CALENDAR" ? "Calendar Staff Member" : "Filter Staff / Owner"}
                    </label>
                    {historyViewMode === "CALENDAR" ? (
                      <select
                        value={calendarUserId || currentUser?.id || employees[0]?.id || ""}
                        onChange={(e) => setCalendarUserId(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      >
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.full_name} ({emp.role})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      >
                        <option value="ALL">All Staff Members ({employees.length})</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.full_name} ({emp.role})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* 2. Month Selector */}
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

                  {/* 3. Year Selector */}
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

                {/* VIEW MODE TOGGLE BUTTONS (TABLE ICON & CALENDAR ICON) */}
                <div className="w-full lg:w-auto flex items-center justify-start lg:justify-end gap-2">
                  <div className="flex items-center w-full sm:w-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <button
                      type="button"
                      title="Table View (Data List)"
                      onClick={() => {
                        setHistoryViewMode("TABLE");
                        setSelectedUserId("ALL");
                      }}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
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
                      onClick={() => {
                        setHistoryViewMode("CALENDAR");
                        if (!calendarUserId && employees.length > 0) {
                          setCalendarUserId(currentUser?.id || employees[0].id);
                        }
                      }}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
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

              {/* Month Navigation Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-['Outfit'] px-2">
                    {MONTH_NAMES[historyMonth]} {historyYear}
                  </span>

                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    title="Next Month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <Button variant="ghost" size="sm" onClick={handleCurrentMonth} className="text-xs ml-1">
                    This Month
                  </Button>
                </div>

                {historyViewMode === "TABLE" && (
                  <div className="flex items-center gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PRESENT">Present Only</option>
                      <option value="ABSENT">Absent Only</option>
                    </select>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-7 pr-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* ---------------------------------------------------- */}
            {/* VIEW 1: MONTHLY CALENDAR VIEW                        */}
            {/* ---------------------------------------------------- */}
            {historyViewMode === "CALENDAR" && (
              <div className="space-y-4">
                {/* Selected Staff Monthly Summary Strip */}
                <Card className="p-4 bg-gradient-to-r from-amber-500/[0.05] via-slate-500/[0.02] to-emerald-500/[0.05] border border-amber-200/60 dark:border-amber-800/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-amber-500/20">
                        {selectedUserObj?.full_name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900 dark:text-white">
                            {selectedUserObj?.full_name || "All Staff Overview"}
                          </h3>
                          {selectedUserObj && (
                            <Badge variant="neutral" size="sm" className="text-[10px]">
                              {selectedUserObj.role}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          Monthly Attendance Sheet &bull; {MONTH_NAMES[historyMonth]} {historyYear}
                        </p>
                      </div>
                    </div>

                    {/* Monthly Metrics Badges */}
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

                {/* Calendar Grid Card */}
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
                      <div key={`pad-${idx}`} className="min-h-[90px] sm:min-h-[105px] h-auto rounded-xl bg-slate-50/50 dark:bg-slate-900/30 opacity-40 border border-dashed border-slate-200 dark:border-slate-800" />
                    ))}

                    {/* Day Cells */}
                    {calendarDays.days.map((d) => {
                      return (
                        <div
                          key={d.dateStr}
                          className={`min-h-[90px] sm:min-h-[105px] h-auto p-2 rounded-xl border flex flex-col justify-between overflow-hidden transition-all select-none ${
                            d.isToday
                              ? "ring-2 ring-amber-500 shadow-sm"
                              : ""
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
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 italic block">Upcoming</span>
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
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* VIEW 2: TABLE VIEW (PURE READ-ONLY DATA LIST)        */}
            {/* (NO ACTIONS / PUNCH OUT COLUMN AS REQUESTED)         */}
            {/* ---------------------------------------------------- */}
            {historyViewMode === "TABLE" && (
              <Card className="overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200 font-['Outfit']">
                      Attendance History Ledger — {MONTH_NAMES[historyMonth]} {historyYear}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({historyTableRows.length} logs)
                    </span>
                  </div>

                  <span className="text-xs text-slate-500">
                    Pure Data Display &bull; Read-Only Audit
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Staff Member</th>
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
                          <td colSpan={isDoubleWay ? 7 : 5} className="py-12 text-center text-slate-400">
                            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                            Loading historical attendance records...
                          </td>
                        </tr>
                      ) : historyTableRows.length === 0 ? (
                        <tr>
                          <td colSpan={isDoubleWay ? 7 : 5} className="py-12 text-center text-slate-400">
                            <UserX className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            No attendance logs match the selected filter criteria.
                          </td>
                        </tr>
                      ) : (
                        historyTableRows.map((item) => {
                          const isPresent = item.attendance_category === "PRESENT";

                          return (
                            <tr
                              key={item.id}
                              className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                                !isPresent ? "bg-rose-50/20 dark:bg-rose-950/10" : ""
                              }`}
                            >
                              {/* Staff Member */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${
                                      isPresent
                                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                        : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                    }`}
                                  >
                                    {item.employee.full_name?.charAt(0).toUpperCase() || "E"}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-900 dark:text-white">
                                        {item.employee.full_name}
                                      </span>
                                      <Badge variant="neutral" size="sm" className="text-[10px]">
                                        {item.employee.role}
                                      </Badge>
                                    </div>
                                    <span className="text-xs text-slate-400 block">
                                      {item.employee.email} {item.employee.phone ? `• ${item.employee.phone}` : ""}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Date */}
                              <td className="py-3.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {formatDate(item.date)}
                              </td>

                              {/* Status */}
                              <td className="py-3.5 px-4">
                                {isPresent ? (
                                  <Badge variant="success" className="font-bold gap-1 text-xs py-1 px-2.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    PRESENT
                                  </Badge>
                                ) : (
                                  <Badge variant="danger" className="font-bold gap-1 text-xs py-1 px-2.5">
                                    <XCircle className="w-3.5 h-3.5" />
                                    ABSENT
                                  </Badge>
                                )}
                              </td>

                              {/* In Time */}
                              <td className="py-3.5 px-4 font-mono text-xs">
                                {item.in_time ? (
                                  <span className="text-slate-800 dark:text-slate-200 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                    {new Date(item.in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">Not Punched</span>
                                )}
                              </td>

                              {/* Out Time (Double Way only) */}
                              {isDoubleWay && (
                                <td className="py-3.5 px-4 font-mono text-xs">
                                  {item.out_time ? (
                                    <span className="text-slate-800 dark:text-slate-200 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                      {new Date(item.out_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                                    </span>
                                  ) : isPresent ? (
                                    <Badge variant="warning" size="sm" className="text-[10px]">
                                      On Shift
                                    </Badge>
                                  ) : (
                                    <span className="text-slate-400 italic">--</span>
                                  )}
                                </td>
                              )}

                              {/* Shift Duration (Double Way only) */}
                              {isDoubleWay && (
                                <td className="py-3.5 px-4 text-xs">
                                  {item.total_hours > 0 ? (
                                    <span className="font-bold text-slate-900 dark:text-white bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-200/50">
                                      {item.total_hours} hrs
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-xs">0 hrs</span>
                                  )}
                                </td>
                              )}

                              {/* Notes Column (Clean Read-Only Display) */}
                              <td className="py-3.5 px-4 text-xs text-slate-500 italic max-w-xs truncate">
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
        )}

        {/* ======================================================== */}
        {/* EDIT / ADJUST IN & OUT TIMES MODAL                      */}
        {/* ======================================================== */}
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title={`Edit Punch Time: ${editingItem?.employee.full_name || "Staff"}`}
          description={`Adjust attendance status, shift in-time, and out-time for ${editingItem?.date}`}
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Attendance Status
              </label>
              <select
                value={modalCategory}
                onChange={(e) => setModalCategory(e.target.value as AttendanceStatus)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white"
              >
                <option value="PRESENT">PRESENT (Attended Shift)</option>
                <option value="ABSENT">ABSENT</option>
                <option value="HALF_DAY">HALF DAY</option>
                <option value="LEAVE">ON LEAVE</option>
              </select>
            </div>

            {modalCategory === "PRESENT" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Clock In (In Time)
                  </label>
                  <input
                    type="time"
                    value={modalInTime}
                    onChange={(e) => setModalInTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-semibold"
                  />
                </div>

                {isDoubleWay && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Clock Out (Out Time)
                    </label>
                    <input
                      type="time"
                      value={modalOutTime}
                      onChange={(e) => setModalOutTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-semibold"
                    />
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Notes / Reason
              </label>
              <input
                type="text"
                placeholder="e.g. Regular shift, approved overtime, late punch correction"
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="ghost" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveModal}
                disabled={actionLoadingId !== null}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold"
              >
                {actionLoadingId !== null ? "Saving Punch..." : "Save Punch Record"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AttendanceManagement;
