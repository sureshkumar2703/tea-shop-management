import React, { useState, useEffect, useMemo } from "react";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { ReceiptModal } from "@/components/modals/ReceiptModal";
import { dataService } from "@/services/supabaseService";
import { Shop, Profile, Order, Salary } from "@/types";
import { formatCurrency, formatDate, getLocalDateStr, isSameLocalDate } from "@/lib/utils";
import { getPdfWatermarkHtml, getPdfWatermarkCss, getPdfHeaderHtml } from "@/lib/pdfUtils";
import {
  Users,
  Store,
  UserCheck,
  Receipt,
  Banknote,
  QrCode,
  Calendar,
  Filter,
  Download,
  Search,
  Printer,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  DollarSign,
  Briefcase,
  Mail,
  Phone,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";

export const ShopEmployeeReport: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Selected Employee State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [employeeTab, setEmployeeTab] = useState<"BILLS" | "SALARY">("BILLS");

  // Filter periods for Bill Report
  const [billPeriod, setBillPeriod] = useState<
    "DAY" | "WEEK" | "MONTH" | "YEAR" | "SELECTED_MONTH" | "SELECTED_YEAR" | "OVERALL"
  >("MONTH");
  const [selectedDay, setSelectedDay] = useState<string>(getLocalDateStr(new Date()));
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedMonthYear, setSelectedMonthYear] = useState<number>(new Date().getFullYear());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Search
  const [employeeSearch, setEmployeeSearch] = useState<string>("");
  const [billSearch, setBillSearch] = useState<string>("");

  // Receipt Modal
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const fetchedShops = await dataService.getShops();
      setShops(fetchedShops);
      if (fetchedShops.length > 0) {
        setSelectedShopId(fetchedShops[0].id);
      }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedShopId) return;
    setLoading(true);
    Promise.all([
      dataService.getEmployees(selectedShopId),
      dataService.getOrders(selectedShopId),
      dataService.getSalaries(selectedShopId),
    ]).then(([empData, ordersData, salariesData]) => {
      // Filter employees for this shop
      const shopStaff = (empData || []).filter(
        (e) => !e.shop_id || e.shop_id === selectedShopId
      );
      setEmployees(shopStaff);
      setOrders(ordersData || []);
      setSalaries(salariesData || []);
      // If previously selected employee not in this shop, select first or reset
      if (shopStaff.length > 0) {
        setSelectedEmployeeId(shopStaff[0].id);
      } else {
        setSelectedEmployeeId(null);
      }
      setLoading(false);
    });
  }, [selectedShopId]);

  const selectedShopObj = shops.find((s) => s.id === selectedShopId) || shops[0];
  const selectedEmployeeObj = employees.find((e) => e.id === selectedEmployeeId) || null;

  // Filtered employees list by search
  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employees;
    const q = employeeSearch.toLowerCase().trim();
    return employees.filter(
      (e) =>
        e.full_name?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.phone?.includes(q) ||
        e.role?.toLowerCase().includes(q)
    );
  }, [employees, employeeSearch]);

  // Employee-Specific Bills with Date Filtering
  const { filteredEmployeeOrders, periodLabel } = useMemo(() => {
    if (!selectedEmployeeId || !selectedEmployeeObj) {
      return { filteredEmployeeOrders: [], periodLabel: "" };
    }

    const now = new Date();
    // Match orders punched by this employee (by ID or name fallback)
    let list = orders.filter((o) => {
      if (o.cashier_id === selectedEmployeeId) return true;
      if (o.cashier_name && selectedEmployeeObj.full_name) {
        return (
          o.cashier_name.toLowerCase().trim() ===
          selectedEmployeeObj.full_name.toLowerCase().trim()
        );
      }
      return false;
    });

    let label = "";

    if (billPeriod === "DAY") {
      list = list.filter(
        (o) =>
          (isSameLocalDate(o.created_at, selectedDay) || o.created_at?.startsWith(selectedDay)) &&
          (o.status === "COMPLETED" || !o.status)
      );
      label = `Day Report: ${formatDate(selectedDay)}`;
    } else if (billPeriod === "WEEK") {
      const d = new Date(now);
      const day = d.getDay();
      const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diffToMonday));
      const mondayStr = getLocalDateStr(monday);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const sundayStr = getLocalDateStr(sunday);

      list = list.filter((o) => {
        const loc = getLocalDateStr(o.created_at);
        return loc >= mondayStr && loc <= sundayStr && (o.status === "COMPLETED" || !o.status);
      });
      label = `Current Week Report (${formatDate(mondayStr)} - ${formatDate(sundayStr)})`;
    } else if (billPeriod === "MONTH") {
      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      list = list.filter((o) => {
        const loc = getLocalDateStr(o.created_at);
        return (
          (loc.startsWith(currentMonthStr) || o.created_at?.startsWith(currentMonthStr)) &&
          (o.status === "COMPLETED" || !o.status)
        );
      });
      label = `Current Month Report: ${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`;
    } else if (billPeriod === "YEAR") {
      const currentYearStr = `${now.getFullYear()}`;
      list = list.filter((o) => {
        const loc = getLocalDateStr(o.created_at);
        return (
          (loc.startsWith(currentYearStr) || o.created_at?.startsWith(currentYearStr)) &&
          (o.status === "COMPLETED" || !o.status)
        );
      });
      label = `Current Year Report: ${now.getFullYear()}`;
    } else if (billPeriod === "SELECTED_MONTH") {
      const monthPrefix = `${selectedMonthYear}-${String(selectedMonth).padStart(2, "0")}`;
      list = list.filter((o) => {
        const loc = getLocalDateStr(o.created_at);
        return (
          (loc.startsWith(monthPrefix) || o.created_at?.startsWith(monthPrefix)) &&
          (o.status === "COMPLETED" || !o.status)
        );
      });
      const monthName = new Date(selectedMonthYear, selectedMonth - 1).toLocaleString("default", {
        month: "long",
      });
      label = `Selected Month Report: ${monthName} ${selectedMonthYear}`;
    } else if (billPeriod === "SELECTED_YEAR") {
      const yearPrefix = `${selectedYear}`;
      list = list.filter((o) => {
        const loc = getLocalDateStr(o.created_at);
        return (
          (loc.startsWith(yearPrefix) || o.created_at?.startsWith(yearPrefix)) &&
          (o.status === "COMPLETED" || !o.status)
        );
      });
      label = `Selected Year Report: Year ${selectedYear}`;
    } else if (billPeriod === "OVERALL") {
      list = list.filter((o) => o.status === "COMPLETED" || !o.status);
      label = "Overall Lifetime Report (All-Time)";
    }

    // Bill Search Term
    if (billSearch.trim()) {
      const q = billSearch.toLowerCase().trim();
      list = list.filter((o) => {
        return (
          o.order_number?.toLowerCase().includes(q) ||
          o.customer_name?.toLowerCase().includes(q) ||
          o.payment_method?.toLowerCase().includes(q)
        );
      });
    }

    return {
      filteredEmployeeOrders: list.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
      periodLabel: label,
    };
  }, [
    orders,
    selectedEmployeeId,
    selectedEmployeeObj,
    billPeriod,
    selectedDay,
    selectedMonth,
    selectedMonthYear,
    selectedYear,
    billSearch,
  ]);

  // Employee-Specific Salaries
  const employeeSalaries = useMemo(() => {
    if (!selectedEmployeeId) return [];
    return salaries.filter((s) => s.employee_id === selectedEmployeeId);
  }, [salaries, selectedEmployeeId]);

  // Bill Metrics
  const totalBills = filteredEmployeeOrders.length;
  const totalSales = filteredEmployeeOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const cashSales = filteredEmployeeOrders.reduce((sum, o) => {
    if (o.payment_method === "CASH") return sum + o.total_amount;
    if (o.payment_method === "SPLIT") return sum + (o.cash_amount || 0);
    return sum;
  }, 0);
  const gpaySales = filteredEmployeeOrders.reduce((sum, o) => {
    if (o.payment_method === "UPI_QR") return sum + o.total_amount;
    if (o.payment_method === "SPLIT") return sum + (o.gpay_amount || 0);
    return sum;
  }, 0);

  // Salary Metrics
  const totalSalaryDisbursed = employeeSalaries.reduce((sum, s) => sum + (s.paid_amount || s.net_payable || 0), 0);
  const totalAllowances = employeeSalaries.reduce((sum, s) => sum + (s.allowances || 0) + (s.bonus || 0), 0);
  const totalDeductions = employeeSalaries.reduce((sum, s) => sum + (s.advances_deducted || 0) + (s.other_deductions || 0), 0);

  // PDF Export for Employee Bills
  const handleExportBillsPDF = () => {
    if (!selectedEmployeeObj) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = filteredEmployeeOrders
      .map(
        (o, idx) => `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${idx + 1}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600; font-size: 11px;">${o.order_number}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${formatDate(o.created_at)} ${new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${o.customer_name || "Walk-in"}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${o.payment_method}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: right; font-weight: 700; color: #047857;">${formatCurrency(o.total_amount)}</td>
      </tr>
    `
      )
      .join("");

    const watermarkHtml = getPdfWatermarkHtml(selectedShopObj?.name || "Store", selectedShopObj?.logo_url);
    const watermarkCss = getPdfWatermarkCss();
    const subtitle = `Staff: ${selectedEmployeeObj.full_name} (${selectedEmployeeObj.role}) • ${periodLabel}`;
    const headerHtml = getPdfHeaderHtml(
      selectedShopObj?.name || "Store",
      selectedShopObj?.address || "Main Store Location",
      `Employee Sales & Bills Report - ${subtitle}`,
      selectedShopObj?.logo_url
    );

    printWindow.document.write(`
      <html>
        <head>
          <title>${selectedEmployeeObj.full_name} - Bills Report</title>
          <style>
            ${watermarkCss}
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1e293b; position: relative; }
            .metrics-grid { display: flex; gap: 12px; margin-bottom: 20px; }
            .metric-box { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc; }
            .metric-title { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 4px; }
            .metric-val { font-size: 16px; font-weight: bold; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-size: 11px; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1; }
          </style>
        </head>
        <body>
          ${watermarkHtml}
          ${headerHtml}
          
          <div class="metrics-grid">
            <div class="metric-box">
              <div class="metric-title">Orders Punched</div>
              <div class="metric-val">${totalBills} Bills</div>
            </div>
            <div class="metric-box">
              <div class="metric-title">Total Sales Collected</div>
              <div class="metric-val" style="color: #047857;">${formatCurrency(totalSales)}</div>
            </div>
            <div class="metric-box">
              <div class="metric-title">Cash Collections</div>
              <div class="metric-val" style="color: #b45309;">${formatCurrency(cashSales)}</div>
            </div>
            <div class="metric-box">
              <div class="metric-title">UPI Collections</div>
              <div class="metric-val" style="color: #1d4ed8;">${formatCurrency(gpaySales)}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Bill Number</th>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Payment Mode</th>
                <th style="text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #94a3b8;">No bills recorded by this staff member for this period.</td></tr>'}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // PDF Export for Employee Salaries
  const handleExportSalaryPDF = () => {
    if (!selectedEmployeeObj) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = employeeSalaries
      .map(
        (s, idx) => `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${idx + 1}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600; font-size: 11px;">${s.month}/${s.year}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${formatCurrency(s.base_salary)}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #047857;">+${formatCurrency((s.bonus || 0) + (s.allowances || 0))}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #dc2626;">-${formatCurrency((s.advances_deducted || 0) + (s.other_deductions || 0))}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: right; font-weight: 700; color: #0f172a;">${formatCurrency(s.paid_amount || s.net_payable)}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${s.payment_status}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${s.payment_date ? formatDate(s.payment_date) : "-"}</td>
      </tr>
    `
      )
      .join("");

    const watermarkHtml = getPdfWatermarkHtml(selectedShopObj?.name || "Store", selectedShopObj?.logo_url);
    const watermarkCss = getPdfWatermarkCss();
    const subtitle = `Staff Member: ${selectedEmployeeObj.full_name} (${selectedEmployeeObj.email || "No Email"}) • Base Pay: ${formatCurrency(selectedEmployeeObj.monthly_salary || 0)}`;
    const headerHtml = getPdfHeaderHtml(
      selectedShopObj?.name || "Store",
      selectedShopObj?.address || "Main Store Location",
      `Employee Salary & Disbursement Statement - ${subtitle}`,
      selectedShopObj?.logo_url
    );

    printWindow.document.write(`
      <html>
        <head>
          <title>${selectedEmployeeObj.full_name} - Salary Ledger</title>
          <style>
            ${watermarkCss}
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1e293b; position: relative; }
            .metrics-grid { display: flex; gap: 12px; margin-bottom: 20px; }
            .metric-box { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc; }
            .metric-title { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 4px; }
            .metric-val { font-size: 16px; font-weight: bold; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-size: 11px; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1; }
          </style>
        </head>
        <body>
          ${watermarkHtml}
          ${headerHtml}
          
          <div class="metrics-grid">
            <div class="metric-box">
              <div class="metric-title">Base Compensation</div>
              <div class="metric-val">${formatCurrency(selectedEmployeeObj.monthly_salary || 20000)}/mo</div>
            </div>
            <div class="metric-box">
              <div class="metric-title">Total Disbursed</div>
              <div class="metric-val" style="color: #047857;">${formatCurrency(totalSalaryDisbursed)}</div>
            </div>
            <div class="metric-box">
              <div class="metric-title">Total Allowances/Bonuses</div>
              <div class="metric-val" style="color: #1d4ed8;">${formatCurrency(totalAllowances)}</div>
            </div>
            <div class="metric-box">
              <div class="metric-title">Advances Deducted</div>
              <div class="metric-val" style="color: #dc2626;">${formatCurrency(totalDeductions)}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Month / Year</th>
                <th>Base Salary</th>
                <th>Bonus & Allowances</th>
                <th>Advances Deducted</th>
                <th style="text-align: right;">Net Paid</th>
                <th>Status</th>
                <th>Payment Date</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #94a3b8;">No salary disbursement records found for this employee.</td></tr>'}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-amber-500" />
              Shop Employees & Individual Staff Reports
            </h1>
            <p className="text-xs text-slate-500">
              Select a shop to view its staff roster. Click on any employee to inspect their individual sales billing and salary ledger.
            </p>
          </div>

          {/* Shop Selector Dropdown */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm">
            <Store className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Shop:</span>
            <select
              value={selectedShopId}
              onChange={(e) => setSelectedShopId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer pr-2"
            >
              {shops.map((s) => (
                <option key={s.id} value={s.id} className="dark:bg-slate-900">
                  {s.name} ({s.shop_code || "Code"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2-Column Layout: Left (Employee Roster) | Right (Selected Employee Report) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT PANEL: Employee Roster (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-amber-500" />
                    Staff Roster ({filteredEmployees.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">{selectedShopObj?.name}</p>
                </div>
              </div>

              {/* Search Employee */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search staff by name or role..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="pl-8 text-xs py-1.5 h-8"
                />
              </div>

              {/* Employee Cards List */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filteredEmployees.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No employees found for this shop.
                  </div>
                ) : (
                  filteredEmployees.map((emp) => {
                    const isSelected = emp.id === selectedEmployeeId;
                    return (
                      <div
                        key={emp.id}
                        onClick={() => setSelectedEmployeeId(emp.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-400 dark:border-amber-700 shadow-sm"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {emp.avatar_url ? (
                            <img
                              src={emp.avatar_url}
                              alt={emp.full_name}
                              className="w-10 h-10 rounded-full object-cover border border-amber-500/20"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-xs">
                              {emp.full_name?.slice(0, 2).toUpperCase() || "EM"}
                            </div>
                          )}
                          <div className="truncate">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {emp.full_name}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate">{emp.email || emp.phone || "No Contact"}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Badge variant={emp.role === "OWNER" ? "info" : emp.role === "ADMIN" ? "amber" : "neutral"} size="sm">
                                {emp.role || "EMPLOYEE"}
                              </Badge>
                              {emp.monthly_salary ? (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {formatCurrency(emp.monthly_salary)}/mo
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? "text-amber-500 translate-x-1" : "text-slate-300"}`} />
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* RIGHT PANEL: Individual Employee Details & Tabs (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {!selectedEmployeeObj ? (
              <Card className="p-12 text-center text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-40 text-amber-500" />
                <h3 className="font-bold text-base text-slate-700 dark:text-slate-300">No Employee Selected</h3>
                <p className="text-xs text-slate-500 mt-1">Please select an employee from the left roster to view their sales and payroll report.</p>
              </Card>
            ) : (
              <>
                {/* Employee Profile Header Card */}
                <Card className="p-5 bg-gradient-to-r from-amber-500/10 via-slate-50 to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 border-amber-500/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      {selectedEmployeeObj.avatar_url ? (
                        <img
                          src={selectedEmployeeObj.avatar_url}
                          alt={selectedEmployeeObj.full_name}
                          className="w-12 h-12 rounded-2xl object-cover border border-amber-500/30 shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white font-black flex items-center justify-center text-sm shadow-sm shadow-amber-500/20">
                          {selectedEmployeeObj.full_name?.slice(0, 2).toUpperCase() || "EM"}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-black text-slate-900 dark:text-white font-['Outfit']">
                            {selectedEmployeeObj.full_name}
                          </h2>
                          <Badge variant="amber" size="sm">
                            {selectedEmployeeObj.role || "EMPLOYEE"}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                          {selectedEmployeeObj.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {selectedEmployeeObj.email}
                            </span>
                          )}
                          {selectedEmployeeObj.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {selectedEmployeeObj.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Store className="w-3 h-3 text-slate-400" />
                            {selectedShopObj?.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Monthly Base Pay</span>
                        <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                          {formatCurrency(selectedEmployeeObj.monthly_salary || 20000)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2 Navigation Tabs: Staff Bills vs Salary Statements */}
                  <div className="flex items-center gap-2 mt-5 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                    <button
                      onClick={() => setEmployeeTab("BILLS")}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                        employeeTab === "BILLS"
                          ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30"
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      Individual Bill Report ({filteredEmployeeOrders.length})
                    </button>
                    <button
                      onClick={() => setEmployeeTab("SALARY")}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                        employeeTab === "SALARY"
                          ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30"
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      Salary & Payroll Ledger ({employeeSalaries.length})
                    </button>
                  </div>
                </Card>

                {/* TAB 1: INDIVIDUAL BILL REPORT */}
                {employeeTab === "BILLS" && (
                  <div className="space-y-4">
                    {/* Period Filter Bar */}
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {[
                            { id: "DAY", label: "Day" },
                            { id: "WEEK", label: "Week" },
                            { id: "MONTH", label: "Month" },
                            { id: "YEAR", label: "Year" },
                            { id: "SELECTED_MONTH", label: "Pick Month" },
                            { id: "SELECTED_YEAR", label: "Pick Year" },
                            { id: "OVERALL", label: "Overall" },
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => setBillPeriod(tab.id as any)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                billPeriod === tab.id
                                  ? "bg-amber-500 text-white"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={handleExportBillsPDF}>
                          PDF Export
                        </Button>
                      </div>

                      {/* Dynamic Date Pickers */}
                      {billPeriod === "DAY" && (
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-xs font-bold text-slate-500">Date:</span>
                          <input
                            type="date"
                            value={selectedDay}
                            onChange={(e) => setSelectedDay(e.target.value)}
                            className="px-2.5 py-1 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                          />
                        </div>
                      )}

                      {billPeriod === "SELECTED_MONTH" && (
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-xs font-bold text-slate-500">Month:</span>
                          <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="px-2.5 py-1 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                              <option key={m} value={m}>
                                {new Date(2000, m - 1, 1).toLocaleString("default", { month: "short" })}
                              </option>
                            ))}
                          </select>
                          <span className="text-xs font-bold text-slate-500">Year:</span>
                          <select
                            value={selectedMonthYear}
                            onChange={(e) => setSelectedMonthYear(Number(e.target.value))}
                            className="px-2.5 py-1 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                          >
                            {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 3 + i).map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {billPeriod === "SELECTED_YEAR" && (
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-xs font-bold text-slate-500">Year:</span>
                          <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="px-2.5 py-1 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                          >
                            {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 3 + i).map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <StatCard
                        title="Bills Punched"
                        value={`${totalBills}`}
                        icon={<Receipt className="w-4 h-4 text-amber-500" />}
                        color="amber"
                      />
                      <StatCard
                        title="Sales Collected"
                        value={formatCurrency(totalSales)}
                        icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
                        color="emerald"
                      />
                      <StatCard
                        title="Cash Handled"
                        value={formatCurrency(cashSales)}
                        icon={<Banknote className="w-4 h-4 text-amber-600" />}
                        color="amber"
                      />
                      <StatCard
                        title="UPI / GPay"
                        value={formatCurrency(gpaySales)}
                        icon={<QrCode className="w-4 h-4 text-blue-500" />}
                        color="blue"
                      />
                    </div>

                    {/* Search & Orders Table */}
                    <Card className="p-4 space-y-3">
                      <div className="relative max-w-sm">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          placeholder="Search bills by #, customer..."
                          value={billSearch}
                          onChange={(e) => setBillSearch(e.target.value)}
                          className="pl-8 text-xs py-1.5 h-8"
                        />
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase">
                              <th className="py-2.5 px-3">Bill #</th>
                              <th className="py-2.5 px-3">Date & Time</th>
                              <th className="py-2.5 px-3">Customer</th>
                              <th className="py-2.5 px-3">Mode</th>
                              <th className="py-2.5 px-3 text-right">Amount</th>
                              <th className="py-2.5 px-3 text-center">Print</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                            {filteredEmployeeOrders.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-6 text-center text-slate-400">
                                  No bills found for this staff member in the selected period.
                                </td>
                              </tr>
                            ) : (
                              filteredEmployeeOrders.map((o) => (
                                <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                  <td className="py-2.5 px-3 font-mono font-bold text-amber-600">{o.order_number}</td>
                                  <td className="py-2.5 px-3 text-slate-500">
                                    {formatDate(o.created_at)}
                                    <span className="block text-[10px] text-slate-400">
                                      {new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{o.customer_name || "Walk-in"}</td>
                                  <td className="py-2.5 px-3">
                                    <Badge variant="neutral" size="sm">
                                      {o.payment_method}
                                    </Badge>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(o.total_amount)}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => {
                                        setSelectedOrderForPrint(o);
                                        setPrintModalOpen(true);
                                      }}
                                    >
                                      <Printer className="w-3.5 h-3.5 text-slate-400 hover:text-amber-500" />
                                    </Button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </div>
                )}

                {/* TAB 2: INDIVIDUAL SALARY LEDGER */}
                {employeeTab === "SALARY" && (
                  <div className="space-y-4">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <StatCard
                        title="Base Salary"
                        value={formatCurrency(selectedEmployeeObj.monthly_salary || 20000)}
                        icon={<Briefcase className="w-4 h-4 text-purple-500" />}
                        color="purple"
                      />
                      <StatCard
                        title="Total Disbursed"
                        value={formatCurrency(totalSalaryDisbursed)}
                        icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
                        color="emerald"
                      />
                      <StatCard
                        title="Total Allowances"
                        value={formatCurrency(totalAllowances)}
                        icon={<DollarSign className="w-4 h-4 text-blue-500" />}
                        color="blue"
                      />
                      <StatCard
                        title="Total Deductions"
                        value={formatCurrency(totalDeductions)}
                        icon={<Banknote className="w-4 h-4 text-amber-600" />}
                        color="amber"
                      />
                    </div>

                    <Card className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                            Salary Statement Ledger
                          </h3>
                          <p className="text-xs text-slate-500">
                            Historical monthly payouts, bonuses, and advances deducted for {selectedEmployeeObj.full_name}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={handleExportSalaryPDF}>
                          PDF Statement
                        </Button>
                      </div>

                      {/* Salary Table */}
                      <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase">
                              <th className="py-2.5 px-3">Month / Year</th>
                              <th className="py-2.5 px-3">Base Pay</th>
                              <th className="py-2.5 px-3">Bonus & Allowances</th>
                              <th className="py-2.5 px-3">Advances Deducted</th>
                              <th className="py-2.5 px-3 text-right">Net Paid</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3">Paid Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                            {employeeSalaries.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="py-6 text-center text-slate-400">
                                  No salary disbursement history found for this employee.
                                </td>
                              </tr>
                            ) : (
                              employeeSalaries.map((s) => (
                                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                  <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                                    Month {s.month}/{s.year}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                                    {formatCurrency(s.base_salary)}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400">
                                    + {formatCurrency((s.bonus || 0) + (s.allowances || 0))}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-red-600 dark:text-red-400">
                                    - {formatCurrency((s.advances_deducted || 0) + (s.other_deductions || 0))}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                                    {formatCurrency(s.paid_amount || s.net_payable)}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <Badge variant={s.payment_status === "PAID" ? "success" : "warning"} size="sm">
                                      {s.payment_status}
                                    </Badge>
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-500">
                                    {s.payment_date ? formatDate(s.payment_date) : "-"}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Print Receipt Modal */}
        {selectedOrderForPrint && (
          <ReceiptModal
            isOpen={printModalOpen}
            onClose={() => setPrintModalOpen(false)}
            order={selectedOrderForPrint}
            shop={selectedShopObj}
          />
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default ShopEmployeeReport;
