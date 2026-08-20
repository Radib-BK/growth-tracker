import { UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLangPath } from "@/hooks/useLangPath";
import { useAuthStore } from "@/store/authStore";

export function Navbar() {
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const { path } = useLangPath();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="font-semibold text-2xl text-foreground">{t("home.title")}</h1>
        {user && (
          <p className="text-muted-foreground" data-testid="user-email">
            {t("home.signedInAs", { email: user.email })}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Link
          to={path("/profile")}
          data-testid="profile-link"
          aria-label={t("nav.profile")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-input text-foreground transition-colors hover:bg-muted"
        >
          <UserRound className="h-5 w-5" />
        </Link>
        <Button type="button" data-testid="logout-btn" variant="outline" onClick={() => void logout()}>
          {t("home.logout")}
        </Button>
      </div>
    </div>
  );
}
