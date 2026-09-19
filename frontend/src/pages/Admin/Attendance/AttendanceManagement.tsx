import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { DataTable } from "@/components/tables/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { dataService } from "@/services/supabaseService";
import { Attendance } from "@/types";
import { formatDate, formatDateTime } from "@/lib/utils";
import { CalendarCheck, Clock, CheckCircle } from "lucide-react";

export const AttendanceManagement: React.FC = () => {
  const [records, setRecords] = useState<Attendance[]>([]);

  useEffect(() => {
    dataService.getAttendance().then(setRecords);
  }, []);

  const columns = [
    {
      key: "employee",
      header: "Staff Member",
      render: (a: Attendance) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white block">{a.employee?.full_name || "Employee"}</span>
          <span className="text-xs text-slate-400">{a.employee?.email}</span>
        </div>
      ),
    },
    {
      key: "attendance_date",
      header: "Date",
      render: (a: Attendance) => <span className="text-xs font-semibold">{formatDate(a.attendance_date)}</span>,
    },
    {
      key: "check_in",
      header: "Clock In",
      render: (a: Attendance) => (
        <span className="text-xs text-slate-700 dark:text-slate-300 font-mono">
          {a.check_in ? formatDateTime(a.check_in) : "--"}
        </span>
      ),
    },
    {
      key: "total_hours",
      header: "Shift Duration",
      render: (a: Attendance) => (
        <span className="font-bold text-xs text-slate-900 dark:text-white">{a.total_hours} hrs</span>
      ),
    },
    {
      key: "status",
      header: "Attendance Status",
      render: (a: Attendance) => <Badge variant={a.status === "PRESENT" ? "success" : "danger"}>{a.status}</Badge>,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
              Daily Staff Attendance
            </h1>
            <p className="text-xs text-slate-500">
              Real-time clock-in / clock-out times and shift durations
            </p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={records}
          searchKey="employee"
          searchPlaceholder="Search attendance records..."
        />
      </div>
    </AdminLayout>
  );
};
export default AttendanceManagement;
