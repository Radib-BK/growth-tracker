import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true,
});

const ACCESS_TOKEN_KEY = "accessToken";

// Skip the token expiry check/refresh flow when hitting this endpoint itself, to avoid recursion.
const REFRESH_URL = "/api/auth/refresh";

// Refresh a bit before actual expiry to cover request latency and clock drift.
const EXPIRY_BUFFER_MS = 10_000;

let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (error: unknown) => void }> = [];

type AuthHandlers = {
  onTokenRefreshed?: (token: string) => void;
  onAuthFailed?: () => void;
};

let authHandlers: AuthHandlers = {};

export function setAuthHandlers(handlers: AuthHandlers) {
  authHandlers = handlers;
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return atob(padded);
}

function getTokenExpiryMs(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(base64UrlDecode(payload)) as { exp?: number };
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isTokenExpiring(token: string): boolean {
  const expiryMs = getTokenExpiryMs(token);
  return expiryMs !== null && Date.now() >= expiryMs - EXPIRY_BUFFER_MS;
}

function processRefreshQueue(error: unknown, token: string | null) {
  refreshQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token!)));
  refreshQueue = [];
}

// Shared by the proactive (pre-request) and reactive (401) refresh paths, so concurrent
// callers wait on a single in-flight /refresh call instead of each firing their own.
async function refreshAccessToken(): Promise<string> {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  try {
    const { data } = await api.post<{ accessToken: string }>(REFRESH_URL);
    const newToken = data.accessToken;

    setAccessToken(newToken);
    authHandlers.onTokenRefreshed?.(newToken);
    processRefreshQueue(null, newToken);
    return newToken;
  } catch (error) {
    processRefreshQueue(error, null);
    clearAccessToken();
    authHandlers.onAuthFailed?.();
    window.location.assign("/login");
    throw error;
  } finally {
    isRefreshing = false;
  }
}

api.interceptors.request.use(async (config) => {
  if (config.url?.includes(REFRESH_URL)) {
    return config;
  }

  let token = getAccessToken();
  if (token && isTokenExpiring(token)) {
    try {
      token = await refreshAccessToken();
    } catch {
      return config;
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes(REFRESH_URL) ||
      originalRequest.url?.includes("/api/auth/login")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newToken = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch {
      return Promise.reject(error);
    }
  },
);
