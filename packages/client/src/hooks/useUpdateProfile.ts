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
      // The users table on Home also renders teamName/bio, so keep it fresh.
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
