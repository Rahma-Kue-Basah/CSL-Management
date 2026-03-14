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

export function useFaqs() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadFaqs = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await authFetch(API_FAQS);
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

        if (isMounted) setFaqs(items);
      } catch {
        if (isMounted) setError("Terjadi kesalahan saat memuat FAQ.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadFaqs();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    faqs,
    setFaqs,
    isLoading,
    error,
    setError,
  };
}

export default useFaqs;
