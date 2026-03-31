"use client";

import { useState } from "react";

import { API_USE_APPROVE, API_USE_REJECT } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import { extractApiErrorMessage } from "@/lib/api-error";

type ActionType = "approve" | "reject";

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
      const response = await authFetch(
        type === "approve" ? API_USE_APPROVE(useId) : API_USE_REJECT(useId),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            type === "reject" && payload?.rejectionNote?.trim()
              ? { rejection_note: payload.rejectionNote.trim() }
              : {},
          ),
        },
      );

      if (response.ok) {
        return { ok: true as const };
      }

      let message = "Gagal memperbarui status pengajuan alat.";
      try {
        const data = (await response.json()) as unknown;
        message = parseUseStatusError(data, message);
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
      setPendingAction({ useId: null, type: null });
    }
  };

  return {
    updateUseStatus,
    pendingAction,
  };
}

export default useUpdateUseStatus;
