"use client";

import { useState } from "react";

import { extractApiErrorMessage } from "@/lib/core";
import {
  borrowEquipmentService,
  type BorrowStatusActionType,
} from "@/services/borrow-equipment";

function parseBorrowStatusError(
  data: unknown,
  fallback = "Gagal memperbarui status pengajuan peminjaman alat.",
) {
  return extractApiErrorMessage(data, fallback);
}

export function useUpdateBorrowStatus() {
  const [pendingAction, setPendingAction] = useState<{
    borrowId: string | number | null;
    type: BorrowStatusActionType | null;
  }>({
    borrowId: null,
    type: null,
  });

  const updateBorrowStatus = async (
    borrowId: string | number,
    type: BorrowStatusActionType,
    payload?: { endTimeActual?: string; inspectionNote?: string; rejectionNote?: string },
  ) => {
    setPendingAction({ borrowId, type });

    try {
      const result = await borrowEquipmentService.updateStatus(
        borrowId,
        type,
        payload,
      );

      if (result.ok) {
        return { ok: true as const };
      }

      let message = "Gagal memperbarui status pengajuan peminjaman alat.";
      if (typeof result.data !== "undefined") {
        message = parseBorrowStatusError(result.data, message);
      }

      return { ok: false as const, message };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan jaringan. Coba lagi.";
      return { ok: false as const, message };
    } finally {
      setPendingAction({ borrowId: null, type: null });
    }
  };

  return {
    updateBorrowStatus,
    pendingAction,
  };
}

export default useUpdateBorrowStatus;
