import type { NextRequest } from "next/server";

export function getRequestCookieValue(
  request: NextRequest,
  name: string,
): string | undefined {
  return request.cookies.get(name)?.value;
}

export function getFirstRequestCookieValue(
  request: NextRequest,
  names: readonly string[],
): string | undefined {
  for (const name of names) {
    const value = getRequestCookieValue(request, name);
    if (value) return value;
  }
  return undefined;
}

export function parseRequestCookieJson<T>(
  request: NextRequest,
  name: string,
): T | undefined {
  const rawValue = getRequestCookieValue(request, name);
  if (!rawValue) return undefined;

  try {
    return JSON.parse(decodeURIComponent(rawValue)) as T;
  } catch {
    return undefined;
  }
}
