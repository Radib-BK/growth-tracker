import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  isSupportedLanguage,
  type SupportedLanguage,
} from "@/lib/i18n-routes";

const LANGUAGE_LABEL_KEYS: Record<SupportedLanguage, string> = {
  en: "common.languageEnglish",
  ar: "common.languageArabic",
};

function LanguageSwitcher({ lang }: { lang: SupportedLanguage }) {
  const { t } = useTranslation();
  const location = useLocation();
  const rest = location.pathname.split("/").slice(2).join("/");
  const suffix = rest ? `/${rest}` : "";

  return (
    <div className="flex w-full max-w-4xl justify-end gap-3 px-6 pt-4 text-sm">
      {SUPPORTED_LANGUAGES.map((code) => (
        <Link
          key={code}
          to={`/${code}${suffix}${location.search}`}
          replace
          className={cn(
            "underline-offset-4 hover:underline",
            code === lang ? "font-semibold text-foreground" : "text-muted-foreground",
          )}
        >
          {t(LANGUAGE_LABEL_KEYS[code])}
        </Link>
      ))}
    </div>
  );
}

export function LocaleLayout() {
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();
  const { i18n } = useTranslation();
  const valid = isSupportedLanguage(lang);
  const activeLang = valid ? lang : DEFAULT_LANGUAGE;

  useEffect(() => {
    if (!valid) return;
    void i18n.changeLanguage(activeLang);
    document.documentElement.lang = activeLang;
    document.documentElement.dir = activeLang === "ar" ? "rtl" : "ltr";
  }, [valid, activeLang, i18n]);

  if (!valid) {
    const rest = location.pathname.split("/").slice(2).join("/");
    return <Navigate to={`/${DEFAULT_LANGUAGE}${rest ? `/${rest}` : ""}`} replace />;
  }

  return (
    <div className="flex w-full flex-col items-center">
      <LanguageSwitcher lang={activeLang} />
      <Outlet />
    </div>
  );
}
