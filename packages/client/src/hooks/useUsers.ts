import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listUsers, type ListUsersParams } from "@/lib/usersApi";

export function useUsers(filters: ListUsersParams) {
  return useQuery({
    queryKey: ["users", filters],
    queryFn: () => listUsers(filters),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
}
