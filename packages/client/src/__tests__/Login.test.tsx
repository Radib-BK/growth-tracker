import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
import { MemoryRouter } from "react-router-dom";
import Login from "@/pages/Login";

const mockNavigate = vi.fn();
const mockLogin = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/store/authStore", () => ({
  useAuthStore: (selector?: (state: Record<string, unknown>) => unknown) => {
    const state = {
      login: mockLogin,
      logout: vi.fn(),
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    };
    return selector ? selector(state) : state;
  },
}));

function renderLogin(initialEntries: string[] = ["/login"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Login />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockNavigate.mockReset();
  mockLogin.mockReset();
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
    mockLogin.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByTestId("email-input"), "test@company.com");
    await user.type(screen.getByTestId("password-input"), "Secret123!");
    await user.click(screen.getByTestId("submit-btn"));

    expect(mockLogin).toHaveBeenCalledWith("test@company.com", "Secret123!");

    await vi.waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/en");
    });
  });

  it("shows an error when credentials are invalid", async () => {
    mockLogin.mockRejectedValue(
      new AxiosError("Unauthorized", "401", undefined, undefined, {
        status: 401,
        data: { message: "Invalid credentials" },
      } as never),
    );
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByTestId("email-input"), "test@company.com");
    await user.type(screen.getByTestId("password-input"), "wrongpass");
    await user.click(screen.getByTestId("submit-btn"));

    expect(await screen.findByTestId("error-message")).toHaveTextContent("Invalid credentials");
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
