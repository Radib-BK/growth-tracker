const CHECK_EMAIL_URL = "http://localhost:8000/api/auth/check-email";

export const EMAIL_UNAVAILABLE_MESSAGE = "This email is already registered";

export async function checkEmailAvailability(
  email: string,
  signal?: AbortSignal,
): Promise<boolean | null> {
  try {
    const res = await fetch(`${CHECK_EMAIL_URL}?email=${encodeURIComponent(email)}`, {
      signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { available: boolean };
    return data.available;
  } catch (error) {
    if (signal?.aborted) throw error;
    return null;
  }
}
