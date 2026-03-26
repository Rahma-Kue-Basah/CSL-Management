"use client";

import { useState } from "react";

import { API_ANNOUNCEMENTS } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import type { Announcement } from "@/hooks/announcements/use-announcements";

type CreateAnnouncementPayload = {
  title: string;
  content: string;
};

export function useCreateAnnouncement() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createAnnouncement = async (payload: CreateAnnouncementPayload) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await authFetch(API_ANNOUNCEMENTS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const payloadData = await response.json().catch(() => ({}));
        const detail =
          typeof (payloadData as { detail?: string })?.detail === "string"
            ? (payloadData as { detail?: string }).detail
            : "Gagal membuat pengumuman.";
        const message = detail || "Gagal membuat pengumuman.";
        setErrorMessage(message);
        return { ok: false as const, message };
      }

      const data = (await response.json().catch(() => null)) as Announcement | null;
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
