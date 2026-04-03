"use client";

import { useEffect, useState } from "react";

import { API_BASE_URL, API_FAQS } from "@/constants/api";
import { authFetch } from "@/lib/auth";

export type Faq = {
  id: string | number;
  question: string;
  answer: string;
  image?: string | number | null;
  image_detail?: {
    id?: string | number;
    url?: string | null;
    name?: string | null;
  } | null;
  imageUrl?: string;
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

function resolveAssetUrl(value?: string | null) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${API_BASE_URL}${value}`;
  return `${API_BASE_URL}/${value}`;
}

function mapFaq(item: Faq): Faq {
  return {
    ...item,
    imageUrl: resolveAssetUrl(item.image_detail?.url ?? ""),
  };
}

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
          ? payload.map(mapFaq)
          : Array.isArray(payload?.results)
            ? payload.results.map(mapFaq)
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
