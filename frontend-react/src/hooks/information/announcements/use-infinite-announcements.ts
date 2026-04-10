"use client";

import { useCallback, useEffect, useState } from "react";

import {
  announcementsService,
  type Announcement,
  type AnnouncementFilters,
} from "@/services/information";

export function useInfiniteAnnouncements(
  pageSize = 10,
  filters: AnnouncementFilters = {},
) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const loadFirstPage = async () => {
      setIsLoading(true);
      setError("");

      try {
        const payload = await announcementsService.getList(
          1,
          pageSize,
          filters,
          controller.signal,
        );
        const items = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.results)
            ? payload.results
            : [];

        if (!isMounted) return;

        setAnnouncements(items);
        setTotalCount(
          Array.isArray(payload) ? items.length : (payload?.count ?? items.length),
        );
        setPage(1);
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
        }
      }
    };

    void loadFirstPage();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [filters.date, filters.ordering, filters.search, pageSize]);

  const hasMore = announcements.length < totalCount;

  const loadMore = useCallback(async () => {
    if (isLoading || isFetchingMore || !hasMore) return;

    const nextPage = page + 1;
    setIsFetchingMore(true);
    setError("");

    try {
      const payload = await announcementsService.getList(
        nextPage,
        pageSize,
        filters,
      );
      const items = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.results)
          ? payload.results
          : [];

      setAnnouncements((current) => [...current, ...items]);
      if (!Array.isArray(payload)) {
        setTotalCount(payload?.count ?? totalCount);
      }
      setPage(nextPage);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Terjadi kesalahan saat memuat pengumuman berikutnya.",
      );
    } finally {
      setIsFetchingMore(false);
    }
  }, [
    filters.date,
    filters.ordering,
    filters.search,
    hasMore,
    isFetchingMore,
    isLoading,
    page,
    pageSize,
    totalCount,
  ]);

  return {
    announcements,
    totalCount,
    isLoading,
    isFetchingMore,
    hasMore,
    error,
    loadMore,
  };
}

export default useInfiniteAnnouncements;
