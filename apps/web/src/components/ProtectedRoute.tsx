import { Navigate, Outlet } from "react-router-dom";
import type { Role } from "@personal-ecommerce/shared";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ allow }: { allow: Role[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-surface-muted">Loading…</div>;
  }

  if (!user || !allow.includes(user.role)) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
