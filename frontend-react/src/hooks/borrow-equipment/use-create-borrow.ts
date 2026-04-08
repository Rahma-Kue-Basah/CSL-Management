"use client";

import { useState } from "react";

import {
  extractApiErrorMessage,
  extractApiErrorMessageFromText,
} from "@/lib/core/api-error";
import {
  borrowEquipmentService,
  type CreateBorrowPayload,
} from "@/services/borrow-equipment/borrow-equipment.service";

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
    "requester_phone",
    "requester_mentor",
    "requester_mentor_profile",
    "institution",
    "institution_address",
  ]);
}

export function useCreateBorrow() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createBorrow = async (payload: CreateBorrowPayload) => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await borrowEquipmentService.create(payload);

      if (result.ok) {
        return { ok: true as const };
      }

      let message = "Gagal membuat pengajuan peminjaman alat. Periksa data lalu coba lagi.";
      if (typeof result.data !== "undefined") {
        message = parseBorrowError(result.data, message);
      } else if (result.text) {
        message = extractApiErrorMessageFromText(result.text, message);
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
