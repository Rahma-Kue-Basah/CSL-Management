"use client";

import { useState } from "react";

import {
  API_BORROW_APPROVE,
  API_BORROW_FINALIZE_RETURN,
  API_BORROW_HANDOVER,
  API_BORROW_MARK_DAMAGED,
  API_BORROW_MARK_LOST,
  API_BORROW_RECEIVE_RETURN,
  API_BORROW_REJECT,
} from "@/constants/api";
import { authFetch } from "@/lib/auth";
import { extractApiErrorMessage } from "@/lib/api-error";

export type BorrowStatusActionType =
  | "approve"
  | "reject"
  | "handover"
  | "receive_return"
  | "finalize_return"
  | "mark_damaged"
  | "mark_lost";

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
      const targetUrl =
        type === "approve"
          ? API_BORROW_APPROVE(borrowId)
          : type === "reject"
            ? API_BORROW_REJECT(borrowId)
            : type === "handover"
              ? API_BORROW_HANDOVER(borrowId)
              : type === "receive_return"
                ? API_BORROW_RECEIVE_RETURN(borrowId)
                : type === "finalize_return"
                  ? API_BORROW_FINALIZE_RETURN(borrowId)
                  : type === "mark_damaged"
                    ? API_BORROW_MARK_DAMAGED(borrowId)
                    : API_BORROW_MARK_LOST(borrowId);

      const body: Record<string, string> = {};
      if (type === "receive_return" && payload?.endTimeActual) {
        body.end_time_actual = payload.endTimeActual;
      }
      if (
        (type === "mark_damaged" || type === "mark_lost") &&
        payload?.inspectionNote?.trim()
      ) {
        body.inspection_note = payload.inspectionNote.trim();
      }
      if (type === "reject" && payload?.rejectionNote?.trim()) {
        body.rejection_note = payload.rejectionNote.trim();
      }

      const response = await authFetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        return { ok: true as const };
      }

      let message = "Gagal memperbarui status pengajuan peminjaman alat.";
      try {
        const data = (await response.json()) as unknown;
        message = parseBorrowStatusError(data, message);
      } catch {
        // ignore parse error
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
