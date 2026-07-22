import { EMAIL_INVALID_MESSAGE, emailFormatSchema } from "@/schemas/signupSchema";
import { api } from "@/lib/api";

export { EMAIL_INVALID_MESSAGE };

export const EMAIL_UNAVAILABLE_MESSAGE = "errors.emailTaken";

export async function checkEmailAvailability(email: string): Promise<boolean | null> {
  if (!emailFormatSchema.safeParse(email).success) return null;

  try {
    const { data } = await api.get<{ available: boolean }>("/api/auth/check-email", {
      params: { email },
    });
    return data.available;
  } catch {
    return null;
  }
}

export async function validateEmailField(email: string): Promise<string | true> {
  const parsed = emailFormatSchema.safeParse(email);
  if (!parsed.success) return parsed.error.issues[0]?.message ?? EMAIL_INVALID_MESSAGE;

  const available = await checkEmailAvailability(email);
  if (available === false) return EMAIL_UNAVAILABLE_MESSAGE;
  return true;
}
