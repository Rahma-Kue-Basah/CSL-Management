"use client";

import { useState } from "react";
import { extractApiErrorMessage } from "@/lib/core";
import {
  softwaresService,
  type CreateSoftwarePayload,
} from "@/services/shared/resources";

export type { CreateSoftwarePayload };

function parseSoftwareError(data: unknown, fallback = "Gagal membuat software.") {
  return extractApiErrorMessage(data, fallback, [
    "name",
    "version",
    "license_info",
    "license_expiration",
    "equipment",
    "description",
  ]);
}

export async function createSoftwareRequest(payload: CreateSoftwarePayload) {
  const result = await softwaresService.create(payload);
  if (result.ok) {
    return { ok: true as const };
  }

  let message = "Gagal membuat software. Periksa data dan coba lagi.";
  if (typeof result.data !== "undefined") {
    message = parseSoftwareError(result.data, message);
  }

  return { ok: false as const, message };
}

export function useCreateSoftware() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createSoftware = async (payload: CreateSoftwarePayload) => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await createSoftwareRequest(payload);
      if (result.ok) {
        return { ok: true as const };
      }
      setErrorMessage(result.message);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan jaringan. Coba lagi.";
      setErrorMessage(message);
      return { ok: false as const, message };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createSoftware, isSubmitting, errorMessage, setErrorMessage };
}

export default useCreateSoftware;
