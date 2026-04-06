"use client";

import { useState } from "react";

import {
  API_PENGUJIAN_APPROVE,
  API_PENGUJIAN_REJECT,
} from "@/constants/api";
import { authFetch } from "@/lib/auth";
import {
  extractApiErrorMessage,
  extractApiErrorMessageFromText,
} from "@/lib/api-error";

type ActionType = "approve" | "reject";

export function useUpdatePengujianStatus() {
  const [pendingAction, setPendingAction] = useState<{
    pengujianId: string | number | null;
    type: ActionType | null;
  }>({
    pengujianId: null,
    type: null,
  });

  const updatePengujianStatus = async (
    pengujianId: string | number,
    type: ActionType,
  ) => {
    setPendingAction({ pengujianId, type });

    try {
      const response = await authFetch(
        type === "approve"
          ? API_PENGUJIAN_APPROVE(pengujianId)
          : API_PENGUJIAN_REJECT(pengujianId),
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        let message =
          type === "approve"
            ? "Gagal menyetujui pengajuan pengujian sampel."
            : "Gagal menolak pengajuan pengujian sampel.";

        try {
          const data = (await response.json()) as unknown;
          message = extractApiErrorMessage(data, message);
        } catch {
          try {
            const text = await response.text();
            message = extractApiErrorMessageFromText(text, message);
          } catch {
            // Keep fallback message when response body cannot be parsed.
          }
        }

        return {
          ok: false as const,
          message,
        };
      }

      const payload = (await response.json()) as Record<string, unknown>;
      return {
        ok: true as const,
        data: payload,
      };
    } catch (error) {
      return {
        ok: false as const,
        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat memproses pengajuan.",
      };
    } finally {
      setPendingAction({ pengujianId: null, type: null });
    }
  };

  return {
    updatePengujianStatus,
    pendingAction,
  };
}

export default useUpdatePengujianStatus;
