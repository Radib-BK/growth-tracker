import { useParams } from "react-router-dom";
import { DEFAULT_LANGUAGE, isSupportedLanguage } from "@/lib/i18n-routes";

export function useLangPath() {
  const { lang } = useParams<{ lang: string }>();
  const currentLang = isSupportedLanguage(lang) ? lang : DEFAULT_LANGUAGE;

  return {
    lang: currentLang,
    path: (segment: string) => `/${currentLang}${segment}`,
  };
}
