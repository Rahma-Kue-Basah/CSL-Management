"use client";

import { useEffect, useState } from "react";

import { API_FAQS } from "@/constants/api";
import { authFetch } from "@/lib/auth";

export type Faq = {
  id: string | number;
  question: string;
  answer: string;
  created_by?: string | number | null;
  created_by_detail?: {
    full_name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type FaqListResponse = {
  count?: number;
  results?: Faq[];
};

export type FaqFilters = {
  search?: string;
  ordering?: "created_at" | "-created_at";
};

export function useFaqs(
  page = 1,
  pageSize = 10,
  filters: FaqFilters = {},
  reloadKey = 0,
) {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const loadFaqs = async () => {
      setIsLoading(true);
      setError("");

      try {
        const url = new URL(API_FAQS, window.location.origin);
        url.searchParams.set("page", String(page));
        url.searchParams.set("page_size", String(pageSize));
        if (filters.search) url.searchParams.set("search", filters.search);
        if (filters.ordering) url.searchParams.set("ordering", filters.ordering);

        const response = await authFetch(url.toString(), {
          signal: controller.signal,
        });
        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({}));
          const detail =
            typeof (errorPayload as { detail?: string })?.detail === "string"
              ? (errorPayload as { detail?: string }).detail
              : "Gagal memuat FAQ.";
          if (isMounted) setError(detail || "Gagal memuat FAQ.");
          return;
        }

        const payload = (await response.json().catch(() => null)) as
          | FaqListResponse
          | Faq[]
          | null;
        const items = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.results)
            ? payload.results
            : [];

        if (isMounted) {
          setFaqs(items);
          setTotalCount(Array.isArray(payload) ? items.length : (payload?.count ?? items.length));
        }
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        if (isMounted) {
          setError("Terjadi kesalahan saat memuat FAQ.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setHasLoadedOnce(true);
        }
      }
    };

    void loadFaqs();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [filters.ordering, filters.search, page, pageSize, reloadKey]);

  return {
    faqs,
    setFaqs,
    totalCount,
    setTotalCount,
    isLoading,
    hasLoadedOnce,
    error,
    setError,
  };
}

export default useFaqs;
