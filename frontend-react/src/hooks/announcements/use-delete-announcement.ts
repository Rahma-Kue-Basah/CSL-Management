"use client";

import { useState } from "react";

import {
  API_ANNOUNCEMENTS,
  API_ANNOUNCEMENTS_BULK_DELETE,
} from "@/constants/api";
import { authFetch } from "@/lib/auth";

export function useDeleteAnnouncement() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const deleteAnnouncement = async (id: string | number) => {
    setIsDeleting(true);
    setErrorMessage("");

    try {
      const response = await authFetch(`${API_ANNOUNCEMENTS}${id}/`, {
        method: "DELETE",
      });

      if (response.ok || response.status === 204) {
        return { ok: true as const };
      }

      const payloadData = await response.json().catch(() => ({}));
      const detail =
        typeof (payloadData as { detail?: string })?.detail === "string"
          ? (payloadData as { detail?: string }).detail
          : `Gagal menghapus pengumuman (${response.status})`;
      const message = detail || `Gagal menghapus pengumuman (${response.status})`;
      setErrorMessage(message);
      return { ok: false as const, message };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menghapus pengumuman.";
      setErrorMessage(message);
      return { ok: false as const, message };
    } finally {
      setIsDeleting(false);
    }
  };

  const bulkDeleteAnnouncements = async (ids: Array<string | number>) => {
    setIsDeleting(true);
    setErrorMessage("");

    try {
      const response = await authFetch(API_ANNOUNCEMENTS_BULK_DELETE, {
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
        const message =
          payload.detail || `Gagal menghapus pengumuman (${response.status})`;
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
          : "Terjadi kesalahan saat menghapus pengumuman.";
      setErrorMessage(message);
      return { ok: false as const, message };
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteAnnouncement,
    bulkDeleteAnnouncements,
    isDeleting,
    errorMessage,
    setErrorMessage,
  };
}

export default useDeleteAnnouncement;
