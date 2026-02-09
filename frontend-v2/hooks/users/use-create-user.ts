"use client";

import { useState } from "react";

import { API_AUTH_REGISTER } from "@/constants/api";
import { authFetch } from "@/lib/auth";

type CreateUserPayload = {
  full_name: string;
  email: string;
  username: string;
  password1: string;
  password2: string;
  role?: string;
  department?: string;
  batch?: string;
  id_number?: string;
  user_type?: string;
};

function parseCreateUserError(data: unknown, fallback = "Gagal membuat user.") {
  if (!data || typeof data !== "object") return fallback;
  const typed = data as Record<string, unknown>;
  if (typeof typed.detail === "string") return typed.detail;
  if (Array.isArray(typed.non_field_errors) && typeof typed.non_field_errors[0] === "string") {
    return typed.non_field_errors[0];
  }
  if (Array.isArray(typed.email) && typeof typed.email[0] === "string") return typed.email[0];
  if (Array.isArray(typed.username) && typeof typed.username[0] === "string") return typed.username[0];
  if (Array.isArray(typed.password1) && typeof typed.password1[0] === "string") return typed.password1[0];
  if (Array.isArray(typed.password2) && typeof typed.password2[0] === "string") return typed.password2[0];
  return fallback;
}

export function useCreateUser() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createUser = async (payload: CreateUserPayload) => {
    setErrorMessage("");
    setIsSubmitting(true);
    try {
      const response = await authFetch(API_AUTH_REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return { ok: true as const };
      }

      let message = "Gagal membuat user. Periksa data dan coba lagi.";
      try {
        const data = (await response.json()) as unknown;
        message = parseCreateUserError(data, message);
      } catch {
        // ignore parse error
      }
      setErrorMessage(message);
      return { ok: false as const, message };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Terjadi kesalahan jaringan. Coba lagi.";
      setErrorMessage(message);
      return { ok: false as const, message };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createUser, isSubmitting, errorMessage, setErrorMessage };
}

export default useCreateUser;

