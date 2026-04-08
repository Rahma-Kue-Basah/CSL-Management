"use client";

import { useEffect, useState } from "react";
import {
  announcementsService,
  type Announcement,
  type AnnouncementFilters,
} from "@/services/information";

export type { Announcement, AnnouncementFilters };

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

    const loadAnnouncements = async () => {
      setIsLoading(true);
      setError("");

      try {
        const payload = await announcementsService.getList(
          page,
          pageSize,
          filters,
          controller.signal,
        );
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
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Terjadi kesalahan saat memuat pengumuman.",
          );
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
