import { useRouter } from "next/navigation";
import { API_AUTH_LOGOUT } from "@/constants/api";
import { authFetch, clearTokens } from "@/lib/auth/fetch";
import { clearProfileCache } from "@/hooks/shared/profile/use-load-profile";

export function useLogout() {
  const router = useRouter();

  const handleLogout = async (): Promise<void> => {
    try {
      await authFetch(API_AUTH_LOGOUT, {
        method: "GET",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearTokens();
      try {
        clearProfileCache();
      } catch (error) {
        console.error("Profile cache clear error:", error);
      }
      router.push("/login");
    }
  };

  return {
    handleLogout,
  };
}
