import { describe, it, expect, vi, afterEach } from "vitest";
import {
  checkEmailAvailability,
  EMAIL_UNAVAILABLE_MESSAGE,
  validateEmailField,
} from "@/lib/checkEmailAvailability";

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
    );
  });

  it("returns false when the email is already registered", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ available: false }),
    });

    await expect(checkEmailAvailability("taken@company.com")).resolves.toBe(false);
  });

  it("does not call the API for invalid email formats", async () => {
    global.fetch = vi.fn();

    await expect(checkEmailAvailability("not-an-email")).resolves.toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("validateEmailField", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a format error before calling the API", async () => {
    global.fetch = vi.fn();

    await expect(validateEmailField("not-an-email")).resolves.toBe("Enter a valid email");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns the unavailable message when the email is taken", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ available: false }),
    });

    await expect(validateEmailField("taken@company.com")).resolves.toBe(
      EMAIL_UNAVAILABLE_MESSAGE,
    );
  });
});
