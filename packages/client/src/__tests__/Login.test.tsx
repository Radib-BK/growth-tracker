import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "@/pages/Login";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

function mockFetchSuccess() {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      accessToken: "test-access-token",
      user: { id: "1", email: "test@company.com" },
    }),
  });
}

function mockFetchError(message = "Invalid credentials") {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ message }),
  });
}

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockNavigate.mockReset();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("Login page", () => {
  it("renders email, password, and submit", () => {
    renderLogin();
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
    expect(screen.getByTestId("email-input")).toBeInTheDocument();
    expect(screen.getByTestId("password-input")).toBeInTheDocument();
    expect(screen.getByTestId("submit-btn")).toBeInTheDocument();
  });

  it("shows email validation error on blur when empty", async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByTestId("email-input"));
    await user.tab();
    expect(await screen.findByText("Email is required")).toBeInTheDocument();
  });

  it("submits credentials and navigates to home on success", async () => {
    mockFetchSuccess();
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByTestId("email-input"), "test@company.com");
    await user.type(screen.getByTestId("password-input"), "Secret123!");
    await user.click(screen.getByTestId("submit-btn"));

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/auth/login",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );

    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body).toEqual({ email: "test@company.com", password: "Secret123!" });

    expect(localStorage.getItem("accessToken")).toBe("test-access-token");

    await vi.waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("shows an error when credentials are invalid", async () => {
    mockFetchError("Invalid credentials");
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByTestId("email-input"), "test@company.com");
    await user.type(screen.getByTestId("password-input"), "wrongpass");
    await user.click(screen.getByTestId("submit-btn"));

    expect(await screen.findByTestId("error-message")).toHaveTextContent("Invalid credentials");
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
