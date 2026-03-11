"use client";

import { useState } from "react";

import { authFetch } from "@/lib/auth";

type DeleteErrorPayload = Record<string, unknown>;

function parseDeleteError(
  data: unknown,
  fallback = "Gagal menghapus data.",
) {
  if (!data || typeof data !== "object") return fallback;
  const typed = data as DeleteErrorPayload;

  if (typeof typed.detail === "string") return typed.detail;
  if (
    Array.isArray(typed.non_field_errors) &&
    typeof typed.non_field_errors[0] === "string"
  ) {
    return typed.non_field_errors[0];
  }

  return fallback;
}

export function useDeleteRecord() {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteRecord = async (url: string) => {
    setIsDeleting(true);

    try {
      const response = await authFetch(url, {
        method: "DELETE",
      });

      if (response.ok) {
        return { ok: true as const };
      }

      let message = "Gagal menghapus data.";
      try {
        const data = (await response.json()) as unknown;
        message = parseDeleteError(data, message);
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
      setIsDeleting(false);
    }
  };

  return {
    deleteRecord,
    isDeleting,
  };
}

export default useDeleteRecord;
