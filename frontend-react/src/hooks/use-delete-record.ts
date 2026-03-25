"use client";

import { useState } from "react";

import { authFetch } from "@/lib/auth";
import { extractApiErrorMessage } from "@/lib/api-error";

function parseDeleteError(
  data: unknown,
  fallback = "Gagal menghapus data.",
) {
  return extractApiErrorMessage(data, fallback);
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
