import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export const ProtectedRoute: React.FC = () => {
  const { user, role, shop, isLoading, logout } = useAuthStore();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Enforce User Active Status
  if (user.is_active === false) {
    logout();
    return <Navigate to="/login" replace state={{ error: "Your account has been deactivated. Please contact your Super Administrator." }} />;
  }

  // Enforce Shop Active & Expiry Status for OWNER and EMPLOYEE
  if (role !== "ADMIN" && shop) {
    if (shop.is_active === false || shop.subscription_status === "SUSPENDED") {
      logout();
      return <Navigate to="/login" replace state={{ error: "Your shop/franchise is currently inactive or suspended. Please contact the Super Administrator." }} />;
    }

    if (!shop.is_lifetime) {
      const expiryDateStr = shop.subscription_end_date || shop.expiry_date;
      if (expiryDateStr) {
        const expiry = new Date(expiryDateStr);
        expiry.setHours(23, 59, 59, 999);
        if (expiry.getTime() < Date.now() || shop.subscription_status === "EXPIRED") {
          const formattedDate = new Date(expiryDateStr).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
          logout();
          return (
            <Navigate
              to="/login"
              replace
              state={{
                error: `Your shop subscription expired on ${formattedDate}. Access is disabled. Please contact Super Admin to renew your franchise license.`,
              }}
            />
          );
        }
      }
    }
  }

  return <Outlet />;
};
export default ProtectedRoute;
