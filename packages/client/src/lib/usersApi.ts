import { api } from "@/lib/api";
import type { User } from "@/lib/authApi";

export type ListUsersParams = {
  page?: number;
  pageSize?: number;
  role?: string;
  department?: string;
  experienceLevel?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type ListUsersResponse = {
  users: User[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  sort: {
    sortBy: string;
    sortOrder: "asc" | "desc";
  };
  filters: {
    role: string | null;
    department: string | null;
    experienceLevel: string | null;
    search: string | null;
  };
};

export async function listUsers(params: ListUsersParams) {
  const { data } = await api.get<ListUsersResponse>("/api/users", { params });
  return data;
}
