export const PASSWORD_RULES = [
  { id: "length", test: (p: string) => p.length >= 8, label: "At least 8 characters" },
  { id: "upper", test: (p: string) => /[A-Z]/.test(p), label: "At least one capital letter" },
  {
    id: "special",
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
    label: "At least one special character",
  },
] as const;
