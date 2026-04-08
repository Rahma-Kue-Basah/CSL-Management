"use client";

import { useState } from "react";
import {
  announcementsService,
  type Announcement,
} from "@/services/information/announcements.service";

type UpdateAnnouncementPayload = Parameters<typeof announcementsService.update>[1];

export function useUpdateAnnouncement() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const updateAnnouncement = async (id: string | number, payload: UpdateAnnouncementPayload) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const result = await announcementsService.update(id, payload);

      if (!result.ok) {
        const payloadData = result.data ?? {};
        const detail =
          typeof (payloadData as { detail?: string })?.detail === "string"
            ? (payloadData as { detail?: string }).detail
            : "Gagal memperbarui pengumuman.";
        const message = detail || "Gagal memperbarui pengumuman.";
        setErrorMessage(message);
        return { ok: false as const, message };
      }

      const data = (result.data ?? null) as Announcement | null;
      return { ok: true as const, data };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat memperbarui pengumuman.";
      setErrorMessage(message);
      return { ok: false as const, message };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { updateAnnouncement, isSubmitting, errorMessage, setErrorMessage };
}

export default useUpdateAnnouncement;
