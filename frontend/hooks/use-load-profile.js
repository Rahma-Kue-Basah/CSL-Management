import { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";

import { API_AUTH_PROFILE } from "@/constants/api";

export function useLoadProfile(user) {
  const [profile, setProfile] = useState(() => {
    if (typeof window === "undefined") {
      return {
        name: user?.name || "User",
        email: user?.email || "",
        canResetPassword: true,
      };
    }

    try {
      const cached = window.localStorage.getItem("profile");
      if (cached) {
        const parsed = JSON.parse(cached);
        const hasAccessToken = Boolean(
          Cookies.get("access_token") || Cookies.get("access"),
        );
        return {
          name: parsed.name || user?.name || "User",
          email: parsed.email || user?.email || "",
          canResetPassword:
            hasAccessToken
              ? true
              : typeof parsed.canResetPassword === "boolean"
                ? parsed.canResetPassword
                : true,
        };
      }
    } catch (error) {
      console.error("Profile cache error:", error);
    }

    return {
      name: user?.name || "User",
      email: user?.email || "",
      canResetPassword: true,
    };
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = window.localStorage.getItem("profile");
      if (cached) return;
    } 

    const loadProfile = async () => {
      try {
        const response = await fetch(API_AUTH_PROFILE, {
          credentials: "include",
        });
        if (!response.ok) return;
        const data = await response.json();
        const hasAccessToken = Boolean(
          Cookies.get("access_token") || Cookies.get("access"),
        );
        const nextProfile = {
          name: data.full_name || data.username || "User",
          email: data.email || "",
          canResetPassword: hasAccessToken,
        };
        setProfile(nextProfile);
        window.localStorage.setItem("profile", JSON.stringify(nextProfile));
      } catch (error) {
        console.error("Profile fetch error:", error);
      }
    };

    loadProfile();
  }, []);

  const initials = useMemo(() => {
    const source = profile.name || profile.email || "U";
    const parts = source.trim().split(/\s+/);
    const letters = parts.slice(0, 2).map((part) => part[0]);
    return letters.join("").toUpperCase() || "U";
  }, [profile.name, profile.email]);

  return {
    profile,
    initials,
  };
}

