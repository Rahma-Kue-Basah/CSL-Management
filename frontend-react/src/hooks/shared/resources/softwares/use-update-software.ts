"use client";

import { useState } from "react";
import { extractApiErrorMessage } from "@/lib/core";
import {
  softwaresService,
  type UpdateSoftwarePayload,
} from "@/services/shared/resources";

export type { UpdateSoftwarePayload };

function parseSoftwareError(data: unknown, fallback = "Gagal memperbarui software.") {
  return extractApiErrorMessage(data, fallback, [
    "name",
    "version",
    "license_info",
    "license_expiration",
    "equipment",
    "description",
  ]);
}

export function useUpdateSoftware() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const updateSoftware = async (softwareId: string | number, payload: UpdateSoftwarePayload) => {
    if (!softwareId) {
      const message = "Software ID kosong.";
      setErrorMessage(message);
      return { ok: false as const, message };
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await softwaresService.update(softwareId, payload);
      if (result.ok) {
        return { ok: true as const, data: (result.data ?? {}) as Record<string, unknown> };
      }
      let message = `Gagal memperbarui software (${result.status}).`;
      if (typeof result.data !== "undefined") {
        message = parseSoftwareError(result.data, message);
      }
      setErrorMessage(message);
      return { ok: false as const, message };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan jaringan. Coba lagi.";
      setErrorMessage(message);
      return { ok: false as const, message };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { updateSoftware, isSubmitting, errorMessage, setErrorMessage };
}

export default useUpdateSoftware;
