import { api } from "@/lib/api";

export type Address = {
  id: string;
  label: string;
  street1: string;
  street2?: string | null;
  city: string;
  zipCode: number;
};

export type User = {
  id: string;
  email: string;
  role?: string;
  department?: string;
  experienceLevel?: string;
  teamName?: string | null;
  bio?: string | null;
  birthdate?: string;
  createdAt?: string;
  addresses?: Address[];
};

export type SignupPayload = {
  email: string;
  password: string;
  role: "LEARNER" | "MANAGER";
  department: string;
  experienceLevel: "JUNIOR" | "MID" | "SENIOR";
  birthdate: string;
  teamName?: string;
  bio?: string;
  addresses: Array<{
    label: string;
    street1: string;
    street2?: string;
    city: string;
    zipCode: number;
  }>;
};

type LoginResponse = {
  accessToken: string;
  user: Pick<User, "id" | "email">;
};

type SignupResponse = {
  accessToken: string;
  user: User;
};

type RefreshResponse = {
  accessToken: string;
};

type MeResponse = {
  user: User;
};

export async function login(email: string, password: string) {
  const { data } = await api.post<LoginResponse>("/api/auth/login", { email, password });
  return data;
}

export async function signup(payload: SignupPayload) {
  const { data } = await api.post<SignupResponse>("/api/auth/signup", payload);
  return data;
}

export async function refreshAccessToken() {
  const { data } = await api.post<RefreshResponse>("/api/auth/refresh");
  return data;
}

export async function logout() {
  await api.post("/api/auth/logout");
}

export async function getMe() {
  const { data } = await api.get<MeResponse>("/api/auth/me");
  return data;
}
