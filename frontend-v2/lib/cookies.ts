"use client";

import Cookies, { type CookieAttributes } from "js-cookie";

type CookieOptions = CookieAttributes & {
  maxAge?: number;
};

export function getCookieValue(name: string): string | null {
  return Cookies.get(name) || null;
}

export function setCookieValue(
  name: string,
  value: string,
  options: CookieOptions = {},
): void {
  const nextOptions: CookieOptions = { ...options };
  if (
    typeof nextOptions.maxAge === "number" &&
    typeof nextOptions.expires === "undefined"
  ) {
    nextOptions.expires = nextOptions.maxAge / (60 * 60 * 24);
    delete nextOptions.maxAge;
  }
  Cookies.set(name, value, nextOptions);
}

export function removeCookieValue(
  name: string,
  options: CookieAttributes = {},
): void {
  Cookies.remove(name, options);
}
