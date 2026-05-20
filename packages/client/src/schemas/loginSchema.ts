import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export function validateLoginField(
  values: LoginFormValues,
  field: keyof LoginFormValues,
): string | undefined {
  const result = loginFormSchema.shape[field].safeParse(values[field]);
  if (result.success) return undefined;
  return result.error.issues[0]?.message;
}

export function validateAllLoginFields(values: LoginFormValues): Record<string, string> {
  const result = loginFormSchema.safeParse(values);
  if (result.success) return {};

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}
