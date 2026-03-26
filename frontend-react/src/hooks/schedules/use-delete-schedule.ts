"use client";

import { useState } from "react";

import { API_SCHEDULE_DETAIL, API_SCHEDULES_BULK_DELETE } from "@/constants/api";
import { authFetch } from "@/lib/auth";

export function useDeleteSchedule() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const deleteSchedule = async (id: string | number) => {
    setIsDeleting(true);
    setErrorMessage("");

    try {
      const response = await authFetch(API_SCHEDULE_DETAIL(id), {
        method: "DELETE",
      });

      if (response.ok || response.status === 204) {
        return { ok: true as const };
      }

      const errorPayload = await response.json().catch(() => ({}));
      const detail =
        typeof (errorPayload as { detail?: string })?.detail === "string"
          ? (errorPayload as { detail?: string }).detail
          : `Gagal menghapus jadwal (${response.status})`;
      const message = detail || `Gagal menghapus jadwal (${response.status})`;
      setErrorMessage(message);
      return { ok: false as const, message };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menghapus jadwal.";
      setErrorMessage(message);
      return { ok: false as const, message };
    } finally {
      setIsDeleting(false);
    }
  };

  const bulkDeleteSchedules = async (ids: Array<string | number>) => {
    setIsDeleting(true);
    setErrorMessage("");

    try {
      const response = await authFetch(API_SCHEDULES_BULK_DELETE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        detail?: string;
        deleted_ids?: Array<string | number>;
        deleted_count?: number;
        failed_ids?: Array<string | number>;
        failed_count?: number;
      };

      if (!response.ok) {
        const message = payload.detail || `Gagal menghapus jadwal (${response.status})`;
        setErrorMessage(message);
        return { ok: false as const, message };
      }

      return {
        ok: true as const,
        deletedIds: payload.deleted_ids ?? [],
        deletedCount: payload.deleted_count ?? 0,
        failedIds: payload.failed_ids ?? [],
        failedCount: payload.failed_count ?? 0,
        message: payload.detail || "",
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menghapus jadwal.";
      setErrorMessage(message);
      return { ok: false as const, message };
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteSchedule,
    bulkDeleteSchedules,
    isDeleting,
    errorMessage,
    setErrorMessage,
  };
}

export default useDeleteSchedule;
