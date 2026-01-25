import { useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";

import {
  API_AUTH_USER_PROFILE,
} from "@/constants/api";
import { authFetch } from "@/lib/auth-fetch";

export function useLoadProfile(user) {
  const hasFetchedRef = useRef(false);
  const [profile, setProfile] = useState(() => {
    if (typeof window === "undefined") {
      return {
        id: user?.id,
        name: user?.name || "User",
        email: user?.email || "",
        role: user?.role,
        department: user?.department,
        batch: user?.batch,
        id_number: user?.id_number,
        user_type: user?.user_type,
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
          id: parsed.id,
          name: parsed.name || user?.name || "User",
          email: parsed.email || user?.email || "",
          role: parsed.role ?? user?.role,
          department: parsed.department ?? user?.department,
          batch: parsed.batch ?? user?.batch,
          id_number: parsed.id_number ?? user?.id_number,
          user_type: parsed.user_type ?? user?.user_type,
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
    if (hasFetchedRef.current) return;

    const accessToken =
      Cookies.get("access_token") ||
      Cookies.get("access") ||
      (typeof window !== "undefined" ? window.localStorage.getItem("access_token") : null);

    let cachedProfile = null;
    if (typeof window !== "undefined") {
      const cached = window.localStorage.getItem("profile");
      if (cached) {
        try {
          cachedProfile = JSON.parse(cached);
        } catch (error) {
          console.error("Profile cache parse error:", error);
        }
      }
    }

    // If cached profile exists, use it and skip network fetch to prevent repeated GETs.
    if (cachedProfile) {
      setProfile((prev) => ({
        ...prev,
        ...cachedProfile,
      }));
      hasFetchedRef.current = true;
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await authFetch(
          API_AUTH_USER_PROFILE,
          {
            credentials: "include",
          },
        );
        if (!response.ok) return;
        const profileData = await response.json();

        const hasAccessToken = Boolean(
          Cookies.get("access_token") || Cookies.get("access"),
        );
        const nextProfile = {
          id: profileData.id,
          name: profileData.full_name || profileData.username || "User",
          email: profileData.email || "",
          role: profileData.role ?? cachedProfile?.role ?? null,
          department: profileData.department ?? cachedProfile?.department ?? null,
          batch: profileData.batch ?? cachedProfile?.batch ?? null,
          id_number: profileData.id_number ?? cachedProfile?.id_number ?? null,
          user_type: profileData.user_type ?? cachedProfile?.user_type ?? null,
          canResetPassword: hasAccessToken,
        };
        setProfile(nextProfile);
        window.localStorage.setItem("profile", JSON.stringify(nextProfile));
        hasFetchedRef.current = true;
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
