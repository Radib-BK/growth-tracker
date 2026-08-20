import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import { useLangPath } from "@/hooks/useLangPath";
import { useAuthStore } from "@/store/authStore";

export function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { t } = useTranslation();
  const { path } = useLangPath();

  if (isLoading) {
    return <p className="text-muted-foreground">{t("common.loading")}</p>;
  }

  if (isAuthenticated) {
    return <Navigate to={path("")} replace />;
  }

  return children;
}
