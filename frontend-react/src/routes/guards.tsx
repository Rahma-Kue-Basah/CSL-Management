import Cookies from "js-cookie";
import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  hasMenuAccess,
  isPrivilegedRole,
  isStaffOrAboveRole,
} from "@/constants/roles";
import { isApprovalOnlyRole } from "@/lib/dashboard-access";

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
  if (!isPrivilegedRole(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function RequireStaffOrAbove({ children }: { children: ReactElement }) {
  const profile = getProfile();
  if (!isStaffOrAboveRole(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function RequireFeatureScope({
  children,
  featurePath,
  scope,
}: {
  children: ReactElement;
  featurePath:
    | "/booking-rooms"
    | "/use-equipment"
    | "/borrow-equipment"
    | "/sample-testing";
  scope: "requester" | "approval";
}) {
  const profile = getProfile();
  const approvalOnlyRole = isApprovalOnlyRole(profile.role);

  if (scope === "requester" && approvalOnlyRole) {
    return <Navigate to={`${featurePath}/approval`} replace />;
  }

  if (scope === "approval" && !approvalOnlyRole && !isPrivilegedRole(profile.role)) {
    return <Navigate to={featurePath} replace />;
  }

  return children;
}

export function RequireMenuAccess({
  children,
  menuId,
}: {
  children: ReactElement;
  menuId:
    | "dashboard"
    | "schedule"
    | "booking-rooms"
    | "use-equipment"
    | "borrow-equipment"
    | "sample-testing"
    | "notifications"
    | "my-profile";
}) {
  const profile = getProfile();
  if (!hasMenuAccess(profile.role, menuId)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
