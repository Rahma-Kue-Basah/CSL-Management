"use client";

import Cookies from "js-cookie";

export function getCookieValue(name) {
  return Cookies.get(name) || null;
}

export function setCookieValue(name, value, options = {}) {
  const nextOptions = { ...options };
  if (
    typeof nextOptions.maxAge === "number" &&
    typeof nextOptions.expires === "undefined"
  ) {
    nextOptions.expires = nextOptions.maxAge / (60 * 60 * 24);
    delete nextOptions.maxAge;
  }
  Cookies.set(name, value, nextOptions);
}

export function removeCookieValue(name, options = {}) {
  Cookies.remove(name, options);
}
