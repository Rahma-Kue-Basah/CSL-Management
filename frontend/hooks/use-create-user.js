"use client";

import { useState } from "react";

import { API_AUTH_REGISTER } from "@/constants/api";
import { authFetch } from "@/lib/auth-fetch";

function parseCreateUserError(data, fallback = "Gagal membuat user.") {
  if (!data || typeof data !== "object") return fallback;
  if (typeof data.detail === "string") return data.detail;
  if (typeof data.non_field_errors?.[0] === "string") return data.non_field_errors[0];
  if (typeof data.email?.[0] === "string") return data.email[0];
  if (typeof data.username?.[0] === "string") return data.username[0];
  if (typeof data.password1?.[0] === "string") return data.password1[0];
  if (typeof data.password2?.[0] === "string") return data.password2[0];
  return fallback;
}

export function useCreateUser() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createUser = async (payload) => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await authFetch(API_AUTH_REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return { ok: true };
      }

      let message = "Gagal membuat user. Periksa data dan coba lagi.";
      try {
        const data = await response.json();
        message = parseCreateUserError(data, message);
      } catch (_) {
        // ignore parse error
      }
      setErrorMessage(message);
      return { ok: false, message };
    } catch (error) {
      const message = error.message || "Terjadi kesalahan jaringan. Coba lagi.";
      setErrorMessage(message);
      return { ok: false, message };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createUser,
    isSubmitting,
    errorMessage,
    setErrorMessage,
  };
}

export default useCreateUser;
