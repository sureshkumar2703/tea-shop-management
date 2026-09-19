import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export const ProtectedRoute: React.FC = () => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
export default ProtectedRoute;
