"use client";

import { useState } from "react";

import { API_BORROWS } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import {
  extractApiErrorMessage,
  extractApiErrorMessageFromText,
} from "@/lib/api-error";

type CreateBorrowPayload = {
  equipmentId: string;
  quantity: number;
  startTime: string;
  endTime: string;
  purpose: string;
  note?: string;
};

function parseBorrowError(
  data: unknown,
  fallback = "Gagal membuat pengajuan peminjaman alat.",
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

export function useCreateBorrow() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createBorrow = async (payload: CreateBorrowPayload) => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const body: Record<string, string | number> = {
        equipment: payload.equipmentId,
        quantity: payload.quantity,
        start_time: payload.startTime,
        end_time: payload.endTime,
        purpose: payload.purpose.trim(),
        note: payload.note?.trim() ?? "",
      };

      const response = await authFetch(API_BORROWS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        return { ok: true as const };
      }

      let message = "Gagal membuat pengajuan peminjaman alat. Periksa data lalu coba lagi.";
      try {
        const raw = await response.text();
        try {
          const data = JSON.parse(raw) as unknown;
          message = parseBorrowError(data, message);
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

  return { createBorrow, isSubmitting, errorMessage, setErrorMessage };
}

export default useCreateBorrow;
