"use client";

import { useState } from "react";

import { API_USES } from "@/constants/api";
import { authFetch } from "@/lib/auth";

type CreateUsePayload = {
  equipmentId: string;
  quantity: number;
  startTime: string;
  endTime?: string;
  purpose: string;
  note?: string;
};

function parseUseError(
  data: unknown,
  fallback = "Gagal membuat pengajuan penggunaan alat.",
) {
  if (!data || typeof data !== "object") return fallback;
  const typed = data as Record<string, unknown>;

  if (typeof typed.detail === "string") return typed.detail;
  if (
    Array.isArray(typed.non_field_errors) &&
    typeof typed.non_field_errors[0] === "string"
  ) {
    return typed.non_field_errors[0];
  }
  if (Array.isArray(typed.equipment) && typeof typed.equipment[0] === "string") {
    return typed.equipment[0];
  }
  if (Array.isArray(typed.quantity) && typeof typed.quantity[0] === "string") {
    return typed.quantity[0];
  }
  if (Array.isArray(typed.start_time) && typeof typed.start_time[0] === "string") {
    return typed.start_time[0];
  }
  if (Array.isArray(typed.end_time) && typeof typed.end_time[0] === "string") {
    return typed.end_time[0];
  }
  if (Array.isArray(typed.purpose) && typeof typed.purpose[0] === "string") {
    return typed.purpose[0];
  }
  if (Array.isArray(typed.note) && typeof typed.note[0] === "string") {
    return typed.note[0];
  }

  return fallback;
}

export function useCreateUse() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createUse = async (payload: CreateUsePayload) => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const body: Record<string, string | number> = {
        equipment: payload.equipmentId,
        quantity: payload.quantity,
        start_time: payload.startTime,
        purpose: payload.purpose.trim(),
      };

      if (payload.endTime?.trim()) body.end_time = payload.endTime.trim();
      if (payload.note?.trim()) body.note = payload.note.trim();

      const response = await authFetch(API_USES, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        return { ok: true as const };
      }

      let message = "Gagal membuat pengajuan penggunaan alat. Periksa data lalu coba lagi.";
      try {
        const data = (await response.json()) as unknown;
        message = parseUseError(data, message);
      } catch {
        // ignore parse error
      }

      setErrorMessage(message);
      return { ok: false as const, message };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan jaringan. Coba lagi.";
      setErrorMessage(message);
      return { ok: false as const, message };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createUse, isSubmitting, errorMessage, setErrorMessage };
}

export default useCreateUse;
