"use client";

import { useState } from "react";
import {
  announcementsService,
  type Announcement,
} from "@/services/information";

type CreateAnnouncementPayload = Parameters<typeof announcementsService.create>[0];

export function useCreateAnnouncement() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createAnnouncement = async (payload: CreateAnnouncementPayload) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const result = await announcementsService.create(payload);

      if (!result.ok) {
        const payloadData = result.data ?? {};
        const detail =
          typeof (payloadData as { detail?: string })?.detail === "string"
            ? (payloadData as { detail?: string }).detail
            : "Gagal membuat pengumuman.";
        const message = detail || "Gagal membuat pengumuman.";
        setErrorMessage(message);
        return { ok: false as const, message };
      }

      const data = (result.data ?? null) as Announcement | null;
      return { ok: true as const, data };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat membuat pengumuman.";
      setErrorMessage(message);
      return { ok: false as const, message };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createAnnouncement, isSubmitting, errorMessage, setErrorMessage };
}

export default useCreateAnnouncement;
