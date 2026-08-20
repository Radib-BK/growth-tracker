import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMe, type UpdateMePayload } from "@/lib/usersApi";
import { useAuthStore } from "@/store/authStore";

export function useUpdateProfile() {
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateMePayload) => updateMe(payload),
    onSuccess: ({ user }) => {
      setUser(user);
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
