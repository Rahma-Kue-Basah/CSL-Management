"use client";

import { useState } from "react";

import {
  extractApiErrorMessage,
  extractApiErrorMessageFromText,
} from "@/lib/core";
import {
  type CreateUsePayload,
  useEquipmentService,
} from "@/services/use-equipment";

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
    "requester_phone",
    "requester_mentor",
    "requester_mentor_profile",
    "institution",
    "institution_address",
  ]);
}

export function useCreateUse() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createUse = async (payload: CreateUsePayload) => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await useEquipmentService.create(payload);

      if (result.ok) {
        return { ok: true as const };
      }

      let message = "Gagal membuat pengajuan penggunaan alat. Periksa data lalu coba lagi.";
      if (typeof result.data !== "undefined") {
        message = parseUseError(result.data, message);
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

  return { createUse, isSubmitting, errorMessage, setErrorMessage };
}

export default useCreateUse;
