"use client";

import { useState } from "react";

import { authFetch } from "@/lib/auth";
import {
  ANNOUNCEMENTS_ENDPOINT,
  FALLBACK_ANNOUNCEMENTS_ENDPOINT,
  buildAnnouncementUrl,
} from "@/hooks/announcements/utils";

export function useDeleteAnnouncement() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const deleteAnnouncement = async (
    id: string | number,
    endpoint = ANNOUNCEMENTS_ENDPOINT,
  ) => {
    setIsDeleting(true);
    setErrorMessage("");

    try {
      let response = await authFetch(buildAnnouncementUrl(endpoint, id), {
        method: "DELETE",
      });

      if (response.status === 404) {
        response = await authFetch(
          buildAnnouncementUrl(FALLBACK_ANNOUNCEMENTS_ENDPOINT, id),
          { method: "DELETE" },
        );
        if (response.ok || response.status === 204) {
          return { ok: true as const, endpoint: FALLBACK_ANNOUNCEMENTS_ENDPOINT };
        }
      }

      if (response.ok || response.status === 204) {
        return { ok: true as const, endpoint };
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

  return { deleteAnnouncement, isDeleting, errorMessage, setErrorMessage };
}

export default useDeleteAnnouncement;
