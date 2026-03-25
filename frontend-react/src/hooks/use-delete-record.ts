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

  const deleteRecords = async (url: string, ids: Array<number | string>) => {
    setIsDeleting(true);

    try {
      const response = await authFetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids }),
      });

      const data = (await response.json().catch(() => null)) as
        | {
            detail?: string;
            deleted_ids?: string[];
            deleted_count?: number;
            failed_ids?: string[];
            failed_count?: number;
          }
        | null;

      if (response.ok) {
        return {
          ok: true as const,
          deletedCount: data?.deleted_count ?? ids.length,
          failedCount: data?.failed_count ?? 0,
          message: data?.detail,
        };
      }

      return {
        ok: false as const,
        message: parseDeleteError(data, "Gagal menghapus data terpilih."),
      };
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
    deleteRecords,
    isDeleting,
  };
}

export default useDeleteRecord;
