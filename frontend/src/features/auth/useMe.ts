import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  is_email_verified: boolean;
  preferred_units: "metric" | "knots";
  default_vessel_class: "small_craft" | "mechanised";
}

export function useMe() {
  return useQuery<UserProfile | null, ApiError>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        const res = await api.get<UserProfile>("/auth/me/", { skipAuthRedirect: true });
        return res;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout/");
    },
    onSuccess: () => {
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.invalidateQueries();
      window.location.href = "/";
    },
  });
}
