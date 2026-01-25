"use client";

import Cookies from "js-cookie";
import { API_AUTH_TOKEN_REFRESH } from "@/constants/api";

function setAccessTokens(accessToken) {
  if (!accessToken) return;
  Cookies.set("access_token", accessToken, { sameSite: "lax" });
  Cookies.set("access", accessToken, { sameSite: "lax" });
  if (typeof window !== "undefined") {
    window.localStorage.setItem("access_token", accessToken);
  }
}

function setRefreshToken(refreshToken) {
  if (!refreshToken) return;
  Cookies.set("refresh_token", refreshToken, { sameSite: "lax" });
  Cookies.set("refresh", refreshToken, { sameSite: "lax" });
  if (typeof window !== "undefined") {
    window.localStorage.setItem("refresh_token", refreshToken);
  }
}

function clearTokens() {
  Cookies.remove("access_token");
  Cookies.remove("access");
  Cookies.remove("refresh_token");
  Cookies.remove("refresh");
  if (typeof window !== "undefined") {
    window.localStorage.clear();
  }
}

function getAccessToken() {
  return (
    Cookies.get("access_token") ||
    Cookies.get("access") ||
    (typeof window !== "undefined"
      ? window.localStorage.getItem("access_token")
      : null)
  );
}

function getRefreshToken() {
  return (
    Cookies.get("refresh_token") ||
    Cookies.get("refresh") ||
    (typeof window !== "undefined"
      ? window.localStorage.getItem("refresh_token")
      : null)
  );
}

async function refreshToken() {
  // Try to read refresh token; if HttpOnly, this returns null but cookie will still be sent via credentials.
  const refresh = getRefreshToken();
  const payload = refresh ? { refresh } : {};

  const resp = await fetch(API_AUTH_TOKEN_REFRESH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: Object.keys(payload).length ? JSON.stringify(payload) : null,
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data?.detail || "Refresh token invalid");
  }

  const data = await resp.json();
  const accessToken = data.access || data.access_token;
  if (accessToken) setAccessTokens(accessToken);
  const newRefresh = data.refresh || data.refresh_token;
  if (newRefresh) setRefreshToken(newRefresh);
  return accessToken;
}

export async function authFetch(url, options = {}, retry = true) {
  const accessToken = getAccessToken();
  const headers = { ...(options.headers || {}) };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const resp = await fetch(url, {
    ...options,
    headers,
    credentials: options.credentials || "include",
  });

  if (resp.status !== 401 || retry === false) return resp;

  // Try refresh on any 401 if refresh token is available
  try {
    await refreshToken();
  } catch (_) {
    clearTokens();
    return resp;
  }

  return authFetch(url, options, false);
}

export {
  setAccessTokens,
  setRefreshToken,
  getAccessToken,
  getRefreshToken,
  refreshToken,
  clearTokens,
};
