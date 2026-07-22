export const SUPPORTED_LANGUAGES = ["en", "ar"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

export function isSupportedLanguage(value: string | undefined): value is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(value as SupportedLanguage);
}

export function detectBrowserLanguage(): SupportedLanguage {
  const preferred = navigator.language.slice(0, 2);
  return isSupportedLanguage(preferred) ? preferred : DEFAULT_LANGUAGE;
}
