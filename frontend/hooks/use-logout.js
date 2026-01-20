import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

import { API_AUTH_LOGOUT } from "@/constants/api";

export function useLogout() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch(API_AUTH_LOGOUT, {
        method: "GET",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      Cookies.remove("access_token");
      Cookies.remove("refresh_token");
      Cookies.remove("access");
      Cookies.remove("refresh");
      Cookies.remove("user");
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

