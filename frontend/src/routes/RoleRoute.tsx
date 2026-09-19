import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { UserRole } from "@/types";
import { getDefaultDashboard } from "@/lib/permissions";

interface RoleRouteProps {
  allowedRoles: UserRole[];
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles }) => {
  const { role, user } = useAuthStore();

  if (!user || !role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={getDefaultDashboard(role)} replace />;
  }

  return <Outlet />;
};
export default RoleRoute;
