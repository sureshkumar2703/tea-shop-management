import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ReceiptModal } from "@/components/modals/ReceiptModal";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { dataService } from "@/services/supabaseService";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { Order, Profile } from "@/types";
import { formatCurrency, formatDate, formatDateTime, getLocalDateStr, isSameLocalDate } from "@/lib/utils";
import { getPdfWatermarkCss, getPdfWatermarkHtml, getPdfHeaderHtml } from "@/lib/pdfUtils";
import {
  UserCheck,
  Users,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  Banknote,
  QrCode,
  Coffee,
  FileSpreadsheet,
  FileText,
  Printer,
  RotateCcw,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  ChevronDown,
} from "lucide-react";

type FilterPeriod =
  | "TODAY"
  | "YESTERDAY"
  | "THIS_WEEK"
  | "THIS_MONTH"
  | "THIS_YEAR"
  | "ALL_TIME"
  | "CUSTOM";

export const UserBillReport: React.FC = () => {
  const navigate = useNavigate();
  const { shop, user } = useAuthStore();
  const cartStore = useCartStore();

  const currentShopId = shop?.id || user?.shop_id;

  // Data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter states
  const [selectedUserId, setSelectedUserId] = useState<string>("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>("THIS_MONTH");
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("ALL");

  // Print modal state
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState<boolean>(false);

  // Load shop data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ordersData, employeesData] = await Promise.all([
          dataService.getOrders(currentShopId),
          dataService.getEmployees(currentShopId),
        ]);
        setOrders(ordersData || []);
        setProfiles(employeesData || []);
      } catch (err) {
        console.error("Error fetching user bill report data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentShopId]);

  // Extract all unique users who generated orders or are registered in shop
  const userList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email?: string; phone?: string; role?: string; profile?: Profile }>();

    // Add registered profiles
    profiles.forEach((p) => {
      map.set(p.id, {
        id: p.id,
        name: p.full_name || "Unknown Staff",
        email: p.email,
        phone: p.phone,
        role: p.role || "EMPLOYEE",
        profile: p,
      });
    });

    // Also scan orders for any cashier not in profiles list
    orders.forEach((o) => {
      if (o.cashier_id && !map.has(o.cashier_id)) {
        map.set(o.cashier_id, {
          id: o.cashier_id,
          name: o.cashier_name || o.cashier?.full_name || "Cashier",
          email: o.cashier?.email,
          phone: o.cashier?.phone,
          role: o.cashier?.role || "EMPLOYEE",
          profile: o.cashier,
        });
      }
    });

    return Array.from(map.values());
  }, [profiles, orders]);

  // Selected User Object
  const selectedUserObj = useMemo(() => {
    if (selectedUserId === "ALL") return null;
    return userList.find((u) => u.id === selectedUserId) || null;
  }, [selectedUserId, userList]);

  // Filter orders by User, Date Period, Payment Method, and Search Term
  const filteredOrders = useMemo(() => {
    let list = [...orders];

    // 1. Filter by User/Cashier
    if (selectedUserId !== "ALL") {
      list = list.filter((o) => {
        if (o.cashier_id === selectedUserId) return true;
        // Fallback matching by name or profile
        if (selectedUserObj && o.cashier_name && selectedUserObj.name) {
          return o.cashier_name.toLowerCase().trim() === selectedUserObj.name.toLowerCase().trim();
        }
        return false;
      });
    }

    // 2. Filter by Date Period in user's local timezone
    const now = new Date();
    const todayStr = getLocalDateStr(now);

    if (selectedPeriod === "TODAY") {
      list = list.filter((o) => isSameLocalDate(o.created_at, todayStr) || o.created_at?.startsWith(todayStr));
    } else if (selectedPeriod === "YESTERDAY") {
      const y = new Date(Date.now() - 86400000);
      const yStr = getLocalDateStr(y);
      list = list.filter((o) => isSameLocalDate(o.created_at, yStr) || o.created_at?.startsWith(yStr));
    } else if (selectedPeriod === "THIS_WEEK") {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(d.setDate(diff));
      const mondayStr = getLocalDateStr(monday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const sundayStr = getLocalDateStr(sunday);
      list = list.filter((o) => {
        const dStr = getLocalDateStr(o.created_at);
        return dStr >= mondayStr && dStr <= sundayStr;
      });
    } else if (selectedPeriod === "THIS_MONTH") {
      const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      list = list.filter((o) => {
        const loc = getLocalDateStr(o.created_at);
        return loc.startsWith(monthPrefix) || o.created_at?.startsWith(monthPrefix);
      });
    } else if (selectedPeriod === "THIS_YEAR") {
      const yearPrefix = `${now.getFullYear()}`;
      list = list.filter((o) => {
        const loc = getLocalDateStr(o.created_at);
        return loc.startsWith(yearPrefix) || o.created_at?.startsWith(yearPrefix);
      });
    } else if (selectedPeriod === "CUSTOM") {
      if (startDate) {
        list = list.filter((o) => getLocalDateStr(o.created_at) >= startDate || o.created_at >= startDate);
      }
      if (endDate) {
        list = list.filter((o) => getLocalDateStr(o.created_at) <= endDate || o.created_at <= `${endDate}T23:59:59`);
      }
    }

    // 3. Filter by Payment Method
    if (paymentMethodFilter !== "ALL") {
      list = list.filter((o) => o.payment_method === paymentMethodFilter);
    }

    // 4. Search Filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((o) => {
        const numMatch = o.order_number?.toLowerCase().includes(q);
        const custMatch = o.customer_name?.toLowerCase().includes(q);
        const phoneMatch = o.customer_phone?.includes(q);
        const cashierMatch = o.cashier_name?.toLowerCase().includes(q);
        const itemMatch = o.items?.some((i) => i.product_name?.toLowerCase().includes(q));
        return numMatch || custMatch || phoneMatch || cashierMatch || itemMatch;
      });
    }

    // Sort newest first
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, selectedUserId, selectedUserObj, selectedPeriod, startDate, endDate, paymentMethodFilter, searchTerm]);

  // Aggregate Metrics for Selected User & Period
  const metrics = useMemo(() => {
    const totalOrders = filteredOrders.length;
    let totalSales = 0;
    let totalCash = 0;
    let totalGpay = 0;
    let totalItems = 0;

    filteredOrders.forEach((o) => {
      const amt = Number(o.total_amount) || 0;
      totalSales += amt;

      if (o.payment_method === "CASH") {
        totalCash += o.cash_amount !== undefined ? Number(o.cash_amount) : amt;
      } else if (o.payment_method === "UPI_QR") {
        totalGpay += o.gpay_amount !== undefined ? Number(o.gpay_amount) : amt;
      } else if (o.payment_method === "SPLIT") {
        totalCash += Number(o.cash_amount) || 0;
        totalGpay += Number(o.gpay_amount) || 0;
      } else {
        totalCash += amt;
      }

      if (o.items && o.items.length > 0) {
        o.items.forEach((item) => {
          totalItems += Number(item.quantity) || 1;
        });
      }
    });

    const averageOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

    return {
      totalOrders,
      totalSales,
      totalCash,
      totalGpay,
      totalItems,
      averageOrderValue,
    };
  }, [filteredOrders]);

  // Helper to re-load order items to cart
  const handleRebill = (order: Order) => {
    if (!order.items || order.items.length === 0) return;
    cartStore.clearCart();
    cartStore.setCustomerInfo(order.customer_name || "Walk-in Guest", order.customer_phone || "");
    cartStore.setOrderType(order.order_type || "DINE_IN");
    if (order.discount_amount) {
      cartStore.setDiscount(order.discount_amount, order.discount_reason || "");
    }

    order.items.forEach((item) => {
      cartStore.addCustomItem({
        product: {
          id: item.product_id || `prod-${Date.now()}`,
          name: item.product_name,
          base_price: item.unit_price,
          category: "General",
          is_active: true,
        } as any,
        variantName: item.variant_name,
        sizeVariant: item.size_variant,
        unitMode: item.unit_mode || "QTY",
        weightGrams: item.weight_grams,
        weightKg: item.weight_kg,
        unitPrice: item.unit_price,
        quantity: item.quantity,
        addons: (item.addons || []).map((a) => ({
          id: a.addon_id || a.id,
          name: (a as any).addon_name || (a as any).name || "Addon",
          price: a.price,
        })),
        notes: item.notes,
      });
    });
    navigate("/admin/billing");
  };

  const handlePrint = (order: Order) => {
    setSelectedOrderForPrint(order);
    setPrintModalOpen(true);
  };

  // Export to Excel (.csv)
  const handleExportExcel = () => {
    if (filteredOrders.length === 0) {
      alert("No bill records found to export for the selected filter.");
      return;
    }

    const userName = selectedUserObj ? selectedUserObj.name : "All_Staff";
    const headers = [
      "Bill No",
      "Date & Time",
      "Cashier / User",
      "User Role",
      "Customer Name",
      "Customer Phone",
      "Order Type",
      "Payment Method",
      "Items Breakdown",
      "Total Amount (INR)",
      "Cash Amount (INR)",
      "UPI Amount (INR)",
      "Received Amount (INR)",
      "Balance (INR)",
      "Payment Status",
    ];

    const rows = filteredOrders.map((o) => {
      const itemsStr =
        o.items && o.items.length > 0
          ? o.items.map((i) => `${i.quantity}x ${i.product_name}`).join(" | ")
          : "N/A";

      return [
        `"${o.order_number}"`,
        `"${formatDateTime(o.created_at)}"`,
        `"${o.cashier_name || selectedUserObj?.name || 'Staff'}"`,
        `"${selectedUserObj?.role || o.cashier?.role || 'EMPLOYEE'}"`,
        `"${o.customer_name || 'Walk-in'}"`,
        `"${o.customer_phone || '-'}"`,
        `"${o.order_type}"`,
        `"${o.payment_method}"`,
        `"${itemsStr.replace(/"/g, '""')}"`,
        o.total_amount,
        o.cash_amount ?? (o.payment_method === 'CASH' ? o.total_amount : 0),
        o.gpay_amount ?? (o.payment_method === 'UPI_QR' ? o.total_amount : 0),
        o.received_amount ?? o.total_amount,
        o.balance_amount ?? 0,
        `"${o.payment_status || o.status || 'PAID'}"`,
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `User_Bill_Report_${userName.replace(/\s+/g, "_")}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (filteredOrders.length === 0) {
      alert("No bill records found to export for the selected filter.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const shopName = shop?.name || "Tea Shop";
    const shopAddress = shop?.address || "";
    const userName = selectedUserObj ? `${selectedUserObj.name} (${selectedUserObj.role})` : "All Staff & Users";
    const dateRangeLabel =
      selectedPeriod === "CUSTOM"
        ? `${startDate} to ${endDate}`
        : selectedPeriod.replace(/_/g, " ");

    const rowsHtml = filteredOrders
      .map((o) => {
        const itemsStr =
          o.items && o.items.length > 0
            ? o.items.map((i) => `${i.quantity}x ${i.product_name}`).join(", ")
            : "-";

        return `
        <tr>
          <td><strong>${o.order_number}</strong></td>
          <td>${formatDateTime(o.created_at)}</td>
          <td>${o.cashier_name || 'Staff'}</td>
          <td>${o.customer_name || 'Walk-in'} ${o.customer_phone ? `<br><small>${o.customer_phone}</small>` : ''}</td>
          <td>${o.order_type}</td>
          <td><span class="badge">${o.payment_method}</span></td>
          <td style="font-size: 11px; max-width: 200px;">${itemsStr}</td>
          <td style="text-align: right; font-weight: bold;">₹${Number(o.total_amount).toFixed(2)}</td>
          <td style="text-align: right;">₹${Number(o.cash_amount ?? (o.payment_method === 'CASH' ? o.total_amount : 0)).toFixed(2)}</td>
          <td style="text-align: right;">₹${Number(o.gpay_amount ?? (o.payment_method === 'UPI_QR' ? o.total_amount : 0)).toFixed(2)}</td>
        </tr>
      `;
      })
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>User Bill Report - ${userName} - ${shopName}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1e293b; line-height: 1.4; position: relative; }
          .shop-title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
          .shop-meta { font-size: 11px; color: #64748b; margin-top: 2px; }
          .report-badge { background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 12px; display: inline-block; margin-bottom: 4px; }
          .user-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
          .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
          .stat-box { background: #f1f5f9; padding: 12px; border-radius: 8px; text-align: center; border-left: 4px solid #f59e0b; }
          .stat-box.green { border-left-color: #10b981; }
          .stat-box.blue { border-left-color: #3b82f6; }
          .stat-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; }
          .stat-val { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
          th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; }
          td { border: 1px solid #e2e8f0; padding: 8px 10px; }
          tr:nth-child(even) { background: #f8fafc; }
          .badge { background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
          .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          ${getPdfWatermarkCss()}
          @media print {
            body { padding: 0; }
            @page { size: landscape; margin: 12mm; }
          }
        </style>
      </head>
      <body>
        ${getPdfWatermarkHtml(shopName, shop?.logo_url)}
        ${getPdfHeaderHtml(shopName, shopAddress, `STAFF BILL REPORT (${userName})`, shop?.logo_url)}

        <div class="user-card">
          <div>
            <div style="font-size: 15px; font-weight: 800; color: #0f172a;">Cashier / User: ${userName}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
              ${selectedUserObj?.phone ? `Phone: ${selectedUserObj.phone} | ` : ''}
              ${selectedUserObj?.email ? `Email: ${selectedUserObj.email}` : ''}
            </div>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 12px; font-weight: 700; color: #475569;">Period:</span>
            <span style="font-size: 12px; font-weight: 800; color: #0f172a; margin-left: 4px;">${dateRangeLabel}</span>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-label">Total Bills</div>
            <div class="stat-val">${metrics.totalOrders}</div>
          </div>
          <div class="stat-box green">
            <div class="stat-label">Total Billed (₹)</div>
            <div class="stat-val">₹${metrics.totalSales.toLocaleString()}</div>
          </div>
          <div class="stat-box green">
            <div class="stat-label">Cash Collected (₹)</div>
            <div class="stat-val">₹${metrics.totalCash.toLocaleString()}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">UPI / Digital (₹)</div>
            <div class="stat-val">₹${metrics.totalGpay.toLocaleString()}</div>
          </div>
          <div class="stat-box blue">
            <div class="stat-label">Avg Bill Value</div>
            <div class="stat-val">₹${metrics.averageOrderValue.toLocaleString()}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Bill No</th>
              <th>Date & Time</th>
              <th>Cashier</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Payment</th>
              <th>Items</th>
              <th style="text-align: right;">Total</th>
              <th style="text-align: right;">Cash</th>
              <th style="text-align: right;">UPI</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          Report generated from ${shopName} Management System. Page 1 of 1
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const periodTabs = [
    { id: "TODAY", label: "Today" },
    { id: "YESTERDAY", label: "Yesterday" },
    { id: "THIS_WEEK", label: "This Week" },
    { id: "THIS_MONTH", label: "This Month" },
    { id: "THIS_YEAR", label: "This Year" },
    { id: "ALL_TIME", label: "All Time" },
    { id: "CUSTOM", label: "Custom Date Range" },
  ];

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-amber-500" />
              Staff & User Bill Report
            </h1>
            <p className="text-xs text-slate-500">
              Select any staff member, cashier, or owner to view and export their individual bill logs, collections, and sales audit.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              onClick={handleExportExcel}
              disabled={filteredOrders.length === 0}
            >
              Download Excel (.csv)
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
              onClick={handleExportPDF}
              disabled={filteredOrders.length === 0}
            >
              Download PDF
            </Button>
          </div>
        </div>

        {/* User Selection & Controls Card */}
        <Card className="p-5 space-y-4 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent border-amber-500/20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* 1. User / Cashier Selector with Searchable Input */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-500" />
                Select Staff / Cashier / User:
              </label>
              <SearchableSelect
                value={
                  selectedUserId === "ALL"
                    ? "All Staff & Cashiers"
                    : selectedUserObj
                    ? `${selectedUserObj.name} (${selectedUserObj.role})`
                    : ""
                }
                options={[
                  { value: "ALL", label: "All Staff & Cashiers" },
                  ...userList.map((u) => ({
                    value: u.id,
                    label: `${u.name} (${u.role})`,
                  })),
                ]}
                placeholder="Type or select staff name..."
                onChange={(displayVal, selectedOption) => {
                  if (selectedOption) {
                    setSelectedUserId(selectedOption.value);
                  } else if (!displayVal.trim() || displayVal.toLowerCase() === "all" || displayVal.toLowerCase().includes("all staff")) {
                    setSelectedUserId("ALL");
                  } else {
                    // Try to match typed text against user names
                    const matched = userList.find(
                      (u) =>
                        u.name.toLowerCase().includes(displayVal.toLowerCase()) ||
                        `${u.name} (${u.role})`.toLowerCase().includes(displayVal.toLowerCase())
                    );
                    if (matched) {
                      setSelectedUserId(matched.id);
                    }
                  }
                }}
                onClear={() => setSelectedUserId("ALL")}
              />
            </div>

            {/* 2. Payment Method Filter with Searchable Select */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-amber-500" />
                Payment Mode:
              </label>
              <SearchableSelect
                value={
                  paymentMethodFilter === "ALL"
                    ? "All Payment Methods"
                    : paymentMethodFilter === "CASH"
                    ? "Cash Only"
                    : paymentMethodFilter === "UPI_QR"
                    ? "Google Pay / UPI Only"
                    : paymentMethodFilter === "SPLIT"
                    ? "Split Payment Only"
                    : paymentMethodFilter
                }
                options={[
                  { value: "ALL", label: "All Payment Methods" },
                  { value: "CASH", label: "Cash Only" },
                  { value: "UPI_QR", label: "Google Pay / UPI Only" },
                  { value: "SPLIT", label: "Split Payment Only" },
                ]}
                placeholder="Select payment method..."
                onChange={(displayVal, selectedOption) => {
                  if (selectedOption) {
                    setPaymentMethodFilter(selectedOption.value);
                  } else if (!displayVal.trim() || displayVal.toLowerCase() === "all") {
                    setPaymentMethodFilter("ALL");
                  }
                }}
                onClear={() => setPaymentMethodFilter("ALL")}
              />
            </div>

            {/* 3. Search Bar */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-amber-500" />
                Search in Bills:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search Bill #, Customer, Phone, Item..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 shadow-sm"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* Selected User Summary Badge Card (if single user chosen) */}
          {selectedUserObj && (
            <div className="p-3.5 bg-amber-500/10 dark:bg-amber-500/5 rounded-xl border border-amber-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center font-bold text-amber-700 dark:text-amber-400 text-base">
                  {selectedUserObj.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {selectedUserObj.name}
                    </span>
                    <Badge variant={selectedUserObj.role === "OWNER" ? "warning" : "neutral"}>
                      {selectedUserObj.role}
                    </Badge>
                    {selectedUserObj.profile?.is_active !== false ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Active Staff
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400 mt-1">
                    {selectedUserObj.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {selectedUserObj.phone}
                      </span>
                    )}
                    {selectedUserObj.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {selectedUserObj.email}
                      </span>
                    )}
                    {selectedUserObj.profile?.monthly_salary ? (
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Monthly Salary: {formatCurrency(selectedUserObj.profile.monthly_salary)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="text-right text-xs text-slate-500">
                <span>Matching Bills in filter: </span>
                <strong className="text-slate-900 dark:text-white font-bold text-sm">
                  {filteredOrders.length}
                </strong>
              </div>
            </div>
          )}
        </Card>

        {/* Date / Period Filter Tabs */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
            {periodTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedPeriod(tab.id as FilterPeriod)}
                className={`px-4 py-2 text-xs font-bold whitespace-nowrap rounded-xl transition-all ${
                  selectedPeriod === tab.id
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range Picker */}
          {selectedPeriod === "CUSTOM" && (
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">From Date:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">To Date:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* 6 Key Performance Metric Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
          <StatCard
            title="Total Bills"
            value={metrics.totalOrders.toString()}
            icon={<Layers className="w-5 h-5 text-blue-500" />}
            subtitle="Completed Bills"
            color="blue"
          />
          <StatCard
            title="Total Sales"
            value={formatCurrency(metrics.totalSales)}
            icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
            subtitle="Gross Revenue"
            color="emerald"
          />
          <StatCard
            title="Cash Collected"
            value={formatCurrency(metrics.totalCash)}
            icon={<Banknote className="w-5 h-5 text-emerald-500" />}
            subtitle="Cash in Drawer"
            color="emerald"
          />
          <StatCard
            title="UPI / GPay"
            value={formatCurrency(metrics.totalGpay)}
            icon={<QrCode className="w-5 h-5 text-amber-500" />}
            subtitle="Digital Receipts"
            color="amber"
          />
          <StatCard
            title="Items / Cups"
            value={metrics.totalItems.toString()}
            icon={<Coffee className="w-5 h-5 text-purple-500" />}
            subtitle="Total Quantities"
            color="purple"
          />
          <StatCard
            title="Average Bill (AOV)"
            value={formatCurrency(metrics.averageOrderValue)}
            icon={<DollarSign className="w-5 h-5 text-indigo-500" />}
            subtitle="Ticket Size"
            color="blue"
          />
        </div>

        {/* User Line-Item Bills Table */}
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Detailed Bills by {selectedUserObj ? selectedUserObj.name : "All Staff"}</span>
                <Badge variant="neutral" className="text-xs">
                  {filteredOrders.length} Bills
                </Badge>
              </h2>
              <p className="text-xs text-slate-500">
                Line-item audit of orders, customer details, payment channels, and quick POS print/rebill actions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                onClick={handleExportExcel}
                disabled={filteredOrders.length === 0}
              >
                Download Excel (.csv)
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                onClick={handleExportPDF}
                disabled={filteredOrders.length === 0}
              >
                Download PDF
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 whitespace-nowrap">
                <tr>
                  <th className="px-3.5 py-3">Bill No</th>
                  <th className="px-3.5 py-3">Time</th>
                  <th className="px-3.5 py-3">Cashier / Staff</th>
                  <th className="px-3.5 py-3">Customer / Phone</th>
                  <th className="px-3.5 py-3">Type</th>
                  <th className="px-3.5 py-3">Payment Method</th>
                  <th className="px-3.5 py-3">Items Summary</th>
                  <th className="px-3.5 py-3 text-right">Total Amount</th>
                  <th className="px-3.5 py-3 text-right">Cash</th>
                  <th className="px-3.5 py-3 text-right">UPI</th>
                  <th className="px-3.5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-xs text-slate-400">
                      Loading user bill records...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-xs text-slate-400">
                      No customer bills found for {selectedUserObj ? selectedUserObj.name : "selected filter"}.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => {
                    const cashVal = o.cash_amount ?? (o.payment_method === "CASH" ? o.total_amount : 0);
                    const upiVal = o.gpay_amount ?? (o.payment_method === "UPI_QR" ? o.total_amount : 0);

                    return (
                      <tr
                        key={o.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors text-xs"
                      >
                        {/* 1. Bill No */}
                        <td className="px-3.5 py-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {o.order_number}
                        </td>

                        {/* 2. Time */}
                        <td className="px-3.5 py-3 whitespace-nowrap text-slate-500">
                          <div>{formatDate(o.created_at)}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </td>

                        {/* 3. Cashier / Staff */}
                        <td className="px-3.5 py-3 whitespace-nowrap font-semibold text-slate-800 dark:text-slate-200">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold">
                              {(o.cashier_name || "S").charAt(0).toUpperCase()}
                            </div>
                            <span>{o.cashier_name || "Staff"}</span>
                          </div>
                        </td>

                        {/* 4. Customer / Phone */}
                        <td className="px-3.5 py-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {o.customer_name || "Walk-in Guest"}
                          </div>
                          {o.customer_phone && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              {o.customer_phone}
                            </div>
                          )}
                        </td>

                        {/* 5. Order Type */}
                        <td className="px-3.5 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              o.order_type === "DINE_IN"
                                ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                                : o.order_type === "TAKEAWAY"
                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                : "bg-purple-500/10 text-purple-700 dark:text-purple-400"
                            }`}
                          >
                            {o.order_type}
                          </span>
                        </td>

                        {/* 6. Payment Method */}
                        <td className="px-3.5 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              o.payment_method === "CASH"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : o.payment_method === "UPI_QR"
                                ? "bg-purple-500/10 text-purple-700 dark:text-purple-400"
                                : "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                            }`}
                          >
                            {o.payment_method}
                          </span>
                        </td>

                        {/* 7. Items Summary */}
                        <td className="px-3.5 py-3 max-w-xs">
                          {o.items && o.items.length > 0 ? (
                            <div className="truncate text-slate-600 dark:text-slate-300" title={o.items.map((i) => `${i.quantity}x ${i.product_name}`).join(", ")}>
                              {o.items.map((i) => `${i.quantity}x ${i.product_name}`).join(", ")}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* 8. Total Amount */}
                        <td className="px-3.5 py-3 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {formatCurrency(o.total_amount)}
                        </td>

                        {/* 9. Cash */}
                        <td className="px-3.5 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {cashVal > 0 ? formatCurrency(cashVal) : "-"}
                        </td>

                        {/* 10. UPI */}
                        <td className="px-3.5 py-3 text-right font-mono text-purple-600 dark:text-purple-400 whitespace-nowrap">
                          {upiVal > 0 ? formatCurrency(upiVal) : "-"}
                        </td>

                        {/* 11. Actions */}
                        <td className="px-3.5 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleRebill(o)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-800 dark:text-amber-300 hover:text-slate-950 transition-colors border border-amber-500/30"
                              title="Rebill / Load items into POS"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Rebill</span>
                            </button>

                            <button
                              onClick={() => handlePrint(o)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700"
                              title="Print Thermal Receipt"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Print</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* 80mm Thermal Receipt Print Modal */}
      <ReceiptModal
        isOpen={printModalOpen}
        onClose={() => {
          setPrintModalOpen(false);
          setSelectedOrderForPrint(null);
        }}
        order={selectedOrderForPrint}
        shop={shop}
      />
    </AdminLayout>
  );
};

export default UserBillReport;
