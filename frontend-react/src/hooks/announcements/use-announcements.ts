"use client";

import { useEffect, useState } from "react";

import { API_ANNOUNCEMENTS } from "@/constants/api";
import { authFetch } from "@/lib/auth";

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

export type AnnouncementFilters = {
  search?: string;
  ordering?: "created_at" | "-created_at";
  date?: string;
};

export function useAnnouncements(
  page = 1,
  pageSize = 10,
  filters: AnnouncementFilters = {},
  reloadKey = 0,
) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const buildListUrl = (baseEndpoint: string) => {
      const url = new URL(baseEndpoint, window.location.origin);
      url.searchParams.set("page", String(page));
      url.searchParams.set("page_size", String(pageSize));
      if (filters.search) url.searchParams.set("search", filters.search);
      if (filters.ordering) url.searchParams.set("ordering", filters.ordering);
      if (filters.date) url.searchParams.set("date", filters.date);
      return url.toString();
    };

    const loadAnnouncements = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await authFetch(buildListUrl(API_ANNOUNCEMENTS), {
          signal: controller.signal,
        });

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

        if (isMounted) {
          setAnnouncements(items);
          setTotalCount(
            Array.isArray(payload) ? items.length : (payload?.count ?? items.length),
          );
        }
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }
        if (isMounted) {
          setError("Terjadi kesalahan saat memuat pengumuman.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setHasLoadedOnce(true);
        }
      }
    };

    void loadAnnouncements();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [filters.date, filters.ordering, filters.search, page, pageSize, reloadKey]);

  return {
    announcements,
    setAnnouncements,
    totalCount,
    setTotalCount,
    isLoading,
    hasLoadedOnce,
    error,
    setError,
  };
}

export default useAnnouncements;
