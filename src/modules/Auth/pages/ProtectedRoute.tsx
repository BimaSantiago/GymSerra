// components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "@/modules/Auth/utils/useAuth";
import type { JSX } from "react";

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}
