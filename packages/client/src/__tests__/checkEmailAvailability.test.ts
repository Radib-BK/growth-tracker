import { describe, it, expect, vi, afterEach } from "vitest";
import { checkEmailAvailability, EMAIL_UNAVAILABLE_MESSAGE } from "@/lib/checkEmailAvailability";

describe("checkEmailAvailability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true when the email is available", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ available: true }),
    });

    await expect(checkEmailAvailability("new@company.com")).resolves.toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/auth/check-email?email=new%40company.com",
      { signal: undefined },
    );
  });

  it("returns false when the email is already registered", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ available: false }),
    });

    await expect(checkEmailAvailability("taken@company.com")).resolves.toBe(false);
  });

  it("exports the unavailable message used by the form", () => {
    expect(EMAIL_UNAVAILABLE_MESSAGE).toBe("This email is already registered");
  });
});
