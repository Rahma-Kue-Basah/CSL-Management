"use client";

import { useEffect, useState } from "react";
import {
  faqService,
  type Faq,
  type FaqFilters,
} from "@/services/information/faq.service";

export type { Faq, FaqFilters };

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
        const payload = await faqService.getList(
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
          setFaqs(items);
          setTotalCount(Array.isArray(payload) ? items.length : (payload?.count ?? items.length));
        }
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Terjadi kesalahan saat memuat FAQ.",
          );
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
