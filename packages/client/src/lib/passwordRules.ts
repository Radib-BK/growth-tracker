import type { TFunction } from "i18next";

export function getPasswordRules(t: TFunction) {
  return [
    { id: "length", test: (p: string) => p.length >= 8, label: t("signup.passwordRuleLength") },
    { id: "upper", test: (p: string) => /[A-Z]/.test(p), label: t("signup.passwordRuleUpper") },
    {
      id: "special",
      test: (p: string) => /[^A-Za-z0-9]/.test(p),
      label: t("signup.passwordRuleSpecial"),
    },
  ] as const;
}
