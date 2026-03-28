"use client";

import { useState } from "react";

import { API_USES } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import {
  extractApiErrorMessage,
  extractApiErrorMessageFromText,
} from "@/lib/api-error";

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
  return extractApiErrorMessage(data, fallback, [
    "equipment",
    "quantity",
    "start_time",
    "end_time",
    "purpose",
    "note",
  ]);
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
        const raw = await response.text();
        try {
          const data = JSON.parse(raw) as unknown;
          message = parseUseError(data, message);
        } catch {
          message = extractApiErrorMessageFromText(raw, message);
        }
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
