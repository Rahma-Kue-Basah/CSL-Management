import Cookies from "js-cookie";
import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";

const ADMIN_ROLES = new Set(["ADMIN", "SUPERADMINISTRATOR", "SUPER_ADMINISTRATOR"]);

type ProfileCookie = {
  role?: string | null;
};

function getAccessToken() {
  return Cookies.get("access") || Cookies.get("access_token");
}

export function hasAuthToken() {
  return Boolean(getAccessToken());
}

function getProfile(): ProfileCookie {
  const cookieProfile = Cookies.get("profile");
  if (cookieProfile) {
    try {
      return JSON.parse(cookieProfile) as ProfileCookie;
    } catch {
      return {};
    }
  }

  const lsProfile = typeof window !== "undefined" ? window.localStorage.getItem("profile") : null;
  if (lsProfile) {
    try {
      return JSON.parse(lsProfile) as ProfileCookie;
    } catch {
      return {};
    }
  }

  return {};
}

export function RequireAuth({ children }: { children: ReactElement }) {
  const location = useLocation();

  if (!hasAuthToken()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export function RequireAdmin({ children }: { children: ReactElement }) {
  const profile = getProfile();
  const normalizedRole = (profile.role ?? "").toString().trim().toUpperCase();
  if (!ADMIN_ROLES.has(normalizedRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
