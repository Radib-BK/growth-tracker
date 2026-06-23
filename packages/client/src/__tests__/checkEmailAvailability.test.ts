import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  checkEmailAvailability,
  EMAIL_UNAVAILABLE_MESSAGE,
  validateEmailField,
} from "@/lib/checkEmailAvailability";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  getAccessToken: vi.fn(),
  setAccessToken: vi.fn(),
  clearAccessToken: vi.fn(),
  setAuthHandlers: vi.fn(),
}));

describe("checkEmailAvailability", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true when the email is available", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { available: true } } as never);

    await expect(checkEmailAvailability("new@company.com")).resolves.toBe(true);
    expect(api.get).toHaveBeenCalledWith("/api/auth/check-email", {
      params: { email: "new@company.com" },
    });
  });

  it("returns false when the email is already registered", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { available: false } } as never);

    await expect(checkEmailAvailability("taken@company.com")).resolves.toBe(false);
  });

  it("does not call the API for invalid email formats", async () => {
    await expect(checkEmailAvailability("not-an-email")).resolves.toBeNull();
    expect(api.get).not.toHaveBeenCalled();
  });
});

describe("validateEmailField", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a format error before calling the API", async () => {
    await expect(validateEmailField("not-an-email")).resolves.toBe("Enter a valid email");
    expect(api.get).not.toHaveBeenCalled();
  });

  it("returns the unavailable message when the email is taken", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { available: false } } as never);

    await expect(validateEmailField("taken@company.com")).resolves.toBe(
      EMAIL_UNAVAILABLE_MESSAGE,
    );
  });
});
