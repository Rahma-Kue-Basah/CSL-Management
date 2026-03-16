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

const PROFILE_CACHE_KEY = "profile";
const PROFILE_CACHE_TS_KEY = "profile_cached_at";
const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000;

let inMemoryProfile: UserProfile | null = null;
let inMemoryProfileAt = 0;
let inFlightProfileRequest: Promise<UserProfile | null> | null = null;

export function clearProfileCache() {
  inMemoryProfile = null;
  inMemoryProfileAt = 0;
  inFlightProfileRequest = null;

  if (typeof window === "undefined") return;

  window.localStorage.removeItem(PROFILE_CACHE_KEY);
  window.localStorage.removeItem(PROFILE_CACHE_TS_KEY);
}

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

function hasAuthToken() {
  return Boolean(getCookieValue("access_token") || getCookieValue("access"));
}

function isFresh(timestamp: number | null | undefined) {
  if (!timestamp || Number.isNaN(timestamp)) return false;
  return Date.now() - timestamp < PROFILE_CACHE_TTL_MS;
}

function parseCachedProfileValue(
  parsed: unknown,
  user?: ProfileUserInput | null,
): UserProfile | null {
  if (!isRecord(parsed)) return null;
  const authTokenPresent = hasAuthToken();
  return {
    id: asProfileId(parsed.id) ?? user?.id ?? null,
    name: asString(parsed.name) ?? user?.name ?? "User",
    email: asString(parsed.email) ?? user?.email ?? "",
    last_login: asString(parsed.last_login) ?? user?.last_login ?? null,
    role: asString(parsed.role) ?? user?.role ?? null,
    department: asString(parsed.department) ?? user?.department ?? null,
    batch: asBatch(parsed.batch) ?? user?.batch ?? null,
    id_number: asString(parsed.id_number) ?? user?.id_number ?? null,
    user_type: asString(parsed.user_type) ?? user?.user_type ?? null,
    canResetPassword:
      authTokenPresent
        ? true
        : typeof parsed.canResetPassword === "boolean"
          ? parsed.canResetPassword
          : true,
  };
}

function getCachedProfile(
  user?: ProfileUserInput | null,
): { profile: UserProfile | null; fetchedAt: number | null } {
  if (typeof window === "undefined") {
    return { profile: null, fetchedAt: null };
  }

  const raw = window.localStorage.getItem(PROFILE_CACHE_KEY);
  if (!raw) return { profile: null, fetchedAt: null };

  try {
    const parsed: unknown = JSON.parse(raw);
    const profile = parseCachedProfileValue(parsed, user);
    const tsRaw = window.localStorage.getItem(PROFILE_CACHE_TS_KEY);
    const fetchedAt = tsRaw ? Number(tsRaw) : null;
    return { profile, fetchedAt };
  } catch (error) {
    console.error("Profile cache parse error:", error);
    return { profile: null, fetchedAt: null };
  }
}

function persistProfileCache(profile: UserProfile) {
  if (typeof window === "undefined") return;
  const now = Date.now();
  window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  window.localStorage.setItem(PROFILE_CACHE_TS_KEY, String(now));
  inMemoryProfile = profile;
  inMemoryProfileAt = now;
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

    if (inMemoryProfile) {
      return {
        ...inMemoryProfile,
        canResetPassword: hasAuthToken(),
      };
    }

    try {
      const { profile: cachedProfile, fetchedAt } = getCachedProfile(user);
      if (cachedProfile) {
        inMemoryProfile = cachedProfile;
        inMemoryProfileAt = fetchedAt ?? inMemoryProfileAt;
        return cachedProfile;
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

    if (inMemoryProfile && isFresh(inMemoryProfileAt)) {
      setProfile({
        ...inMemoryProfile,
        canResetPassword: hasAuthToken(),
      });
      hasFetchedRef.current = true;
      return;
    }

    const cached = getCachedProfile(user);
    if (cached.profile) {
      setProfile(cached.profile);
      inMemoryProfile = cached.profile;
      inMemoryProfileAt = cached.fetchedAt ?? inMemoryProfileAt;
      if (isFresh(cached.fetchedAt)) {
        hasFetchedRef.current = true;
        return;
      }
    }

    const loadProfile = async () => {
      if (inFlightProfileRequest) {
        const sharedProfile = await inFlightProfileRequest;
        if (sharedProfile) setProfile(sharedProfile);
        hasFetchedRef.current = true;
        return;
      }

      try {
        inFlightProfileRequest = (async () => {
          const response = await authFetch(API_AUTH_USER_PROFILE, {
            credentials: "include",
          });
          if (!response.ok) return null;
          const profileData: unknown = await response.json();
          if (!isRecord(profileData)) return null;

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
            canResetPassword: hasAuthToken(),
          };
          persistProfileCache(nextProfile);
          return nextProfile;
        })();

        const latestProfile = await inFlightProfileRequest;
        if (latestProfile) setProfile(latestProfile);
      } catch (error) {
        console.error("Profile fetch error:", error);
      } finally {
        inFlightProfileRequest = null;
        hasFetchedRef.current = true;
      }
    };

    void loadProfile();
  }, [user]);

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
