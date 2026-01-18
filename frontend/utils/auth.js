import Cookies from "js-cookie";

/**
 * Get access token from cookies
 */
export function getAccessToken() {
  return Cookies.get("access_token");
}

/**
 * Get refresh token from cookies
 */
export function getRefreshToken() {
  return Cookies.get("refresh_token");
}

/**
 * Get user info from cookies
 */
export function getUser() {
  const userStr = Cookies.get("user");
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
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
  Cookies.remove("user");
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
