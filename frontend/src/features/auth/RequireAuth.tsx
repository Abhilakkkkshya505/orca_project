import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useMe } from "./useMe";
import { Skeleton } from "@/components/ui/skeleton";

export interface RequireAuthProps {
  children: React.ReactNode;
}

/**
 * Validates that `next` is a safe, same-origin relative path (preventing open redirect vulnerabilities).
 */
export function sanitizeNextPath(path: string | null | undefined): string {
  if (!path || typeof path !== "string") return "/dashboard";
  // Must start with a single "/" and not "//" (which browsers treat as protocol-relative URL)
  if (path.startsWith("/") && !path.startsWith("//") && !path.includes("://")) {
    return path;
  }
  return "/dashboard";
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { data: user, isLoading } = useMe();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 max-w-4xl mx-auto flex flex-col gap-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!user) {
    const currentPath = `${location.pathname}${location.search}`;
    const safeNext = sanitizeNextPath(currentPath);
    return <Navigate to={`/login?next=${encodeURIComponent(safeNext)}`} replace />;
  }

  if (!user.is_email_verified) {
    return <Navigate to="/verify-email" replace />;
  }

  return <>{children}</>;
};
