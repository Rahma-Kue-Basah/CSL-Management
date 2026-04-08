"use client";

import { useState } from "react";
import { extractApiErrorMessage } from "@/lib/core/api-error";
import {
  usersService,
  type CreateUserPayload,
} from "@/services/shared/resources/users.service";

export type { CreateUserPayload };

function parseCreateUserError(data: unknown, fallback = "Gagal membuat user.") {
  return extractApiErrorMessage(data, fallback, [
    "email",
    "username",
    "password1",
    "password2",
    "batch",
    "department",
    "id_number",
    "institution",
    "role",
    "is_mentor",
  ]);
}

export function useCreateUser() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createUser = async (payload: CreateUserPayload) => {
    setErrorMessage("");
    setIsSubmitting(true);
    try {
      const result = await usersService.create(payload);

      if (result.ok) {
        return { ok: true as const };
      }

      let message = "Gagal membuat user. Periksa data dan coba lagi.";
      if (typeof result.data !== "undefined") {
        message = parseCreateUserError(result.data, message);
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
