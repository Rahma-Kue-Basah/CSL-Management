"use client";

import { API_AUTH_TOKEN_REFRESH } from "@/constants/api";
import { getCookieValue, setCookieValue, removeCookieValue } from "@/lib/cookies";

function setAccessTokens(accessToken) {
  if (!accessToken) return;
  setCookieValue("access_token", accessToken, { sameSite: "lax" });
  setCookieValue("access", accessToken, { sameSite: "lax" });
  if (typeof window !== "undefined") {
    window.localStorage.setItem("access_token", accessToken);
  }
}

function setRefreshToken(refreshToken) {
  if (!refreshToken) return;
  setCookieValue("refresh_token", refreshToken, { sameSite: "lax" });
  setCookieValue("refresh", refreshToken, { sameSite: "lax" });
  if (typeof window !== "undefined") {
    window.localStorage.setItem("refresh_token", refreshToken);
  }
}

function clearTokens() {
  removeCookieValue("access_token");
  removeCookieValue("access");
  removeCookieValue("refresh_token");
  removeCookieValue("refresh");
  if (typeof window !== "undefined") {
    window.localStorage.clear();
  }
}

function getAccessToken() {
  return (
    getCookieValue("access_token") ||
    getCookieValue("access") ||
    (typeof window !== "undefined"
      ? window.localStorage.getItem("access_token")
      : null)
  );
}

function getRefreshToken() {
  return (
    getCookieValue("refresh_token") ||
    getCookieValue("refresh") ||
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
