"use client";

import { useState } from "react";

import { extractApiErrorMessage } from "@/lib/core";
import {
  useEquipmentService,
  type UseStatusActionType as ActionType,
} from "@/services/use-equipment";

function parseUseStatusError(
  data: unknown,
  fallback = "Gagal memperbarui status pengajuan alat.",
) {
  return extractApiErrorMessage(data, fallback);
}

export function useUpdateUseStatus() {
  const [pendingAction, setPendingAction] = useState<{
    useId: string | number | null;
    type: ActionType | null;
  }>({
    useId: null,
    type: null,
  });

  const updateUseStatus = async (
    useId: string | number,
    type: ActionType,
    payload?: { rejectionNote?: string },
  ) => {
    setPendingAction({ useId, type });

    try {
      const result = await useEquipmentService.updateStatus(useId, type, payload);

      if (result.ok) {
        return { ok: true as const };
      }

      let message = "Gagal memperbarui status pengajuan alat.";
      if (typeof result.data !== "undefined") {
        message = parseUseStatusError(result.data, message);
      }

      return { ok: false as const, message };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan jaringan. Coba lagi.";
      return { ok: false as const, message };
    } finally {
      setPendingAction({ useId: null, type: null });
    }
  };

  return {
    updateUseStatus,
    pendingAction,
  };
}

export default useUpdateUseStatus;
