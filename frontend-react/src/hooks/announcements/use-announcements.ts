"use client";

import { useEffect, useState } from "react";

import { authFetch } from "@/lib/auth";
import {
  ANNOUNCEMENTS_ENDPOINT,
  FALLBACK_ANNOUNCEMENTS_ENDPOINT,
} from "@/hooks/announcements/utils";

export type Announcement = {
  id: string | number;
  title: string;
  content: string;
  created_by?: string | number | null;
  created_at?: string | null;
};

type AnnouncementListResponse = {
  count?: number;
  results?: Announcement[];
};

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [endpoint, setEndpoint] = useState(ANNOUNCEMENTS_ENDPOINT);

  useEffect(() => {
    let isMounted = true;

    const loadAnnouncements = async () => {
      setIsLoading(true);
      setError("");

      try {
        let response = await authFetch(ANNOUNCEMENTS_ENDPOINT);
        if (response.status === 404) {
          response = await authFetch(FALLBACK_ANNOUNCEMENTS_ENDPOINT);
          if (response.ok && isMounted) {
            setEndpoint(FALLBACK_ANNOUNCEMENTS_ENDPOINT);
          }
        } else if (response.ok && isMounted) {
          setEndpoint(ANNOUNCEMENTS_ENDPOINT);
        }

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({}));
          const detail =
            typeof (errorPayload as { detail?: string })?.detail === "string"
              ? (errorPayload as { detail?: string }).detail
              : "Gagal memuat pengumuman.";
          if (isMounted) setError(detail || "Gagal memuat pengumuman.");
          return;
        }

        const payload = (await response.json().catch(() => null)) as
          | AnnouncementListResponse
          | Announcement[]
          | null;
        const items = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.results)
            ? payload.results
            : [];

        if (isMounted) setAnnouncements(items);
      } catch (loadError) {
        if (isMounted) {
          setError("Terjadi kesalahan saat memuat pengumuman.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadAnnouncements();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    announcements,
    setAnnouncements,
    isLoading,
    error,
    setError,
    endpoint,
    setEndpoint,
  };
}

export default useAnnouncements;
