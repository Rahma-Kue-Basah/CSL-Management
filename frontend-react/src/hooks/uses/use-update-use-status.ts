"use client";

import { useState } from "react";

import { API_USE_APPROVE, API_USE_REJECT } from "@/constants/api";
import { authFetch } from "@/lib/auth";

type ActionType = "approve" | "reject";

type UseStatusErrorPayload = Record<string, unknown>;

function parseUseStatusError(
  data: unknown,
  fallback = "Gagal memperbarui status pengajuan alat.",
) {
  if (!data || typeof data !== "object") return fallback;
  const typed = data as UseStatusErrorPayload;

  if (typeof typed.detail === "string") return typed.detail;
  if (
    Array.isArray(typed.non_field_errors) &&
    typeof typed.non_field_errors[0] === "string"
  ) {
    return typed.non_field_errors[0];
  }

  return fallback;
}

export function useUpdateUseStatus() {
  const [pendingAction, setPendingAction] = useState<{
    useId: string | number | null;
    type: ActionType | null;
  }>({
    useId: null,
    type: null,
  });

  const updateUseStatus = async (useId: string | number, type: ActionType) => {
    setPendingAction({ useId, type });

    try {
      const response = await authFetch(
        type === "approve" ? API_USE_APPROVE(useId) : API_USE_REJECT(useId),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
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
