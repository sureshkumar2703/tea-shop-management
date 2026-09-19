import { UserRole } from "@/types";

export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: {
    canManageAllShops: true,
    canManageAllUsers: true,
    canViewPlatformAnalytics: true,
    canAccessSettings: true,
  },
  ADMIN: {
    canManageProducts: true,
    canManageInventory: true,
    canManageEmployees: true,
    canManageExpenses: true,
    canManageSalaries: true,
    canViewReports: true,
    canManageShopSettings: true,
    canPerformBilling: true,
  },
  EMPLOYEE: {
    canPerformBilling: true,
    canViewAssignedShift: true,
    canClockInOut: true,
    canViewDailyOrders: true,
  },
};

export function hasPermission(role: UserRole | undefined, requiredRole: UserRole | UserRole[]): boolean {
  if (!role) return false;
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(role);
  }
  return role === requiredRole;
}

export function getDefaultDashboard(role: UserRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/super-admin/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    case "EMPLOYEE":
      return "/employee/billing";
    default:
      return "/login";
  }
}
