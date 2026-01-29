import { getCookieValue, removeCookieValue } from "@/lib/cookies";

/**
 * Get access token from cookies
 */
export function getAccessToken() {
  return getCookieValue("access_token");
}

/**
 * Get refresh token from cookies
 */
export function getRefreshToken() {
  return getCookieValue("refresh_token");
}

/**
 * Get user info from cookies
 */
export function getUser() {
  const userStr = getCookieValue("user");
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!getAccessToken();
}

/**
 * Clear all auth cookies
 */
export function clearAuthCookies() {
  removeCookieValue("access_token");
  removeCookieValue("refresh_token");
  removeCookieValue("user");
}

/**
 * Create authenticated fetch request with credentials
 */
export async function authFetch(url, options = {}) {
  const token = getAccessToken();

  const defaultOptions = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  return fetch(url, { ...defaultOptions, ...options });
}
