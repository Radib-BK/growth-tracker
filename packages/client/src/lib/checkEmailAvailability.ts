import { emailFormatSchema } from "@/schemas/signupSchema";

const CHECK_EMAIL_URL = "http://localhost:8000/api/auth/check-email";

export const EMAIL_UNAVAILABLE_MESSAGE = "This email is already registered";

export async function checkEmailAvailability(email: string): Promise<boolean | null> {
  if (!emailFormatSchema.safeParse(email).success) return null;

  try {
    const res = await fetch(`${CHECK_EMAIL_URL}?email=${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { available: boolean };
    return data.available;
  } catch {
    return null;
  }
}

export async function validateEmailField(email: string): Promise<string | true> {
  const parsed = emailFormatSchema.safeParse(email);
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Enter a valid email";

  const available = await checkEmailAvailability(email);
  if (available === false) return EMAIL_UNAVAILABLE_MESSAGE;
  return true;
}
