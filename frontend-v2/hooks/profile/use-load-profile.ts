import { useEffect, useMemo, useRef, useState } from "react";
import { getCookieValue } from "@/lib/cookies";

import { API_AUTH_USER_PROFILE } from "@/constants/api";
import { authFetch } from "@/lib/auth";

type ProfileId = string | number;
type Batch = string | number;

export type ProfileUserInput = {
  id?: ProfileId | null;
  name?: string | null;
  email?: string | null;
  last_login?: string | null;
  role?: string | null;
  department?: string | null;
  batch?: Batch | null;
  id_number?: string | null;
  user_type?: string | null;
};

export type UserProfile = {
  id?: ProfileId | null;
  name: string;
  email: string;
  last_login?: string | null;
  role?: string | null;
  department?: string | null;
  batch?: Batch | null;
  id_number?: string | null;
  user_type?: string | null;
  canResetPassword: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asBatch(value: unknown): Batch | null {
  return typeof value === "string" || typeof value === "number" ? value : null;
}

function asProfileId(value: unknown): ProfileId | null {
  return typeof value === "string" || typeof value === "number" ? value : null;
}

export function useLoadProfile(user?: ProfileUserInput | null) {
  const hasFetchedRef = useRef(false);
  const [profile, setProfile] = useState<UserProfile>(() => {
    if (typeof window === "undefined") {
      return {
        id: user?.id,
        name: user?.name || "User",
        email: user?.email || "",
        last_login: user?.last_login || null,
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
        const parsed: unknown = JSON.parse(cached);
        if (!isRecord(parsed)) {
          throw new Error("Invalid cached profile shape");
        }
        const hasAccessToken = Boolean(
          getCookieValue("access_token") || getCookieValue("access"),
        );
        return {
          id: asProfileId(parsed.id) ?? user?.id,
          name: asString(parsed.name) ?? user?.name ?? "User",
          email: asString(parsed.email) ?? user?.email ?? "",
          last_login: asString(parsed.last_login) ?? user?.last_login ?? null,
          role: asString(parsed.role) ?? user?.role,
          department: asString(parsed.department) ?? user?.department,
          batch: asBatch(parsed.batch) ?? user?.batch,
          id_number: asString(parsed.id_number) ?? user?.id_number,
          user_type: asString(parsed.user_type) ?? user?.user_type,
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

    let cachedProfile: Partial<UserProfile> | null = null;
    if (typeof window !== "undefined") {
      const cached = window.localStorage.getItem("profile");
      if (cached) {
        try {
          const parsed: unknown = JSON.parse(cached);
          if (isRecord(parsed)) {
            cachedProfile = {
              id: asProfileId(parsed.id),
              name: asString(parsed.name) ?? undefined,
              email: asString(parsed.email) ?? undefined,
              last_login: asString(parsed.last_login),
              role: asString(parsed.role),
              department: asString(parsed.department),
              batch: asBatch(parsed.batch),
              id_number: asString(parsed.id_number),
              user_type: asString(parsed.user_type),
              canResetPassword:
                typeof parsed.canResetPassword === "boolean"
                  ? parsed.canResetPassword
                  : undefined,
            };
          }
        } catch (error) {
          console.error("Profile cache parse error:", error);
        }
      }
    }

    // Use cached profile for fast initial render, then refresh from API.
    if (cachedProfile) {
      setProfile((prev) => ({
        ...prev,
        ...cachedProfile,
      }));
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
        const profileData: unknown = await response.json();
        if (!isRecord(profileData)) return;

        const hasAccessToken = Boolean(
          getCookieValue("access_token") || getCookieValue("access"),
        );
        const nextProfile: UserProfile = {
          id: asProfileId(profileData.id) ?? null,
          name:
            asString(profileData.full_name) ??
            asString(profileData.username) ??
            "User",
          email: asString(profileData.email) ?? "",
          last_login: asString(profileData.last_login) ?? null,
          role: asString(profileData.role) ?? null,
          department: asString(profileData.department) ?? null,
          batch: asBatch(profileData.batch) ?? null,
          id_number: asString(profileData.id_number) ?? null,
          user_type: asString(profileData.user_type) ?? null,
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
