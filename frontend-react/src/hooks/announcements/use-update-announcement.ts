"use client";

import { useState } from "react";

import { authFetch } from "@/lib/auth";
import {
  ANNOUNCEMENTS_ENDPOINT,
  FALLBACK_ANNOUNCEMENTS_ENDPOINT,
  buildAnnouncementUrl,
} from "@/hooks/announcements/utils";
import type { Announcement } from "@/hooks/announcements/use-announcements";

type UpdateAnnouncementPayload = {
  title: string;
  content: string;
};

export function useUpdateAnnouncement() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const updateAnnouncement = async (
    id: string | number,
    payload: UpdateAnnouncementPayload,
    endpoint = ANNOUNCEMENTS_ENDPOINT,
  ) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      let response = await authFetch(buildAnnouncementUrl(endpoint, id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 404) {
        response = await authFetch(
          buildAnnouncementUrl(FALLBACK_ANNOUNCEMENTS_ENDPOINT, id),
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        if (response.ok) {
          return {
            ok: true as const,
            data: (await response.json().catch(() => null)) as Announcement | null,
            endpoint: FALLBACK_ANNOUNCEMENTS_ENDPOINT,
          };
        }
      }

      if (!response.ok) {
        const payloadData = await response.json().catch(() => ({}));
        const detail =
          typeof (payloadData as { detail?: string })?.detail === "string"
            ? (payloadData as { detail?: string }).detail
            : "Gagal memperbarui pengumuman.";
        const message = detail || "Gagal memperbarui pengumuman.";
        setErrorMessage(message);
        return { ok: false as const, message };
      }

      const data = (await response.json().catch(() => null)) as Announcement | null;
      return { ok: true as const, data, endpoint };
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
