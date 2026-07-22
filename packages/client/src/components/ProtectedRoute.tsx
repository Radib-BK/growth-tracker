import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
import { useLangPath } from "@/hooks/useLangPath";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const { path } = useLangPath();

  if (isLoading) {
    return <p className="text-muted-foreground">{t("common.loading")}</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to={path("/login")} replace />;
  }

  return children;
}
