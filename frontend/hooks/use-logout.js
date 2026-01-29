import { useRouter } from "next/navigation";
import { removeCookieValue } from "@/lib/cookies";

import { API_AUTH_LOGOUT } from "@/constants/api";
import { authFetch } from "@/lib/auth-fetch";

export function useLogout() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authFetch(API_AUTH_LOGOUT, {
        method: "GET",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      removeCookieValue("access_token");
      removeCookieValue("accessToken");
      removeCookieValue("refresh_token");
      removeCookieValue("access");
      removeCookieValue("refresh");
      removeCookieValue("user");
      try {
        if (typeof window !== "undefined") {
          window.localStorage.clear();
        }
      } catch (error) {
        console.error("LocalStorage clear error:", error);
      }
      router.push("/login");
    }
  };

  return {
    handleLogout,
  };
}
