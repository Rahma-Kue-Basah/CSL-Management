"use client";

import { useState } from "react";
import { extractApiErrorMessage } from "@/lib/core";
import {
  equipmentsService,
  type UpdateEquipmentPayload,
} from "@/services/shared/resources";

export type { UpdateEquipmentPayload };

function parseEquipmentError(data: unknown, fallback = "Gagal memperbarui peralatan.") {
  return extractApiErrorMessage(data, fallback, [
    "name",
    "quantity",
    "category",
    "status",
    "room",
    "is_moveable",
    "image",
  ]);
}

export function useUpdateEquipment() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const updateEquipment = async (equipmentId: string | number, payload: UpdateEquipmentPayload) => {
    if (!equipmentId) {
      const message = "Equipment ID kosong.";
      setErrorMessage(message);
      return { ok: false as const, message };
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await equipmentsService.update(equipmentId, payload);

      if (result.ok) {
        return { ok: true as const, data: (result.data ?? {}) as Record<string, unknown> };
      }

      let message = `Gagal memperbarui peralatan (${result.status}).`;
      if (typeof result.data !== "undefined") {
        message = parseEquipmentError(result.data, message);
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

  return { updateEquipment, isSubmitting, errorMessage, setErrorMessage };
}

export default useUpdateEquipment;
