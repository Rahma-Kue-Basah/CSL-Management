"use client";

import { useState } from "react";

import { authFetch } from "@/lib/auth";
import { FAQS_ENDPOINT } from "@/hooks/faqs/utils";
import type { Faq } from "@/hooks/faqs/use-faqs";

type CreateFaqPayload = {
  question: string;
  answer: string;
};

export function useCreateFaq() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createFaq = async (payload: CreateFaqPayload) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await authFetch(FAQS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const payloadData = await response.json().catch(() => ({}));
        const detail =
          typeof (payloadData as { detail?: string })?.detail === "string"
            ? (payloadData as { detail?: string }).detail
            : "Gagal membuat FAQ.";
        const message = detail || "Gagal membuat FAQ.";
        setErrorMessage(message);
        return { ok: false as const, message };
      }

      const data = (await response.json().catch(() => null)) as Faq | null;
      return { ok: true as const, data };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat membuat FAQ.";
      setErrorMessage(message);
      return { ok: false as const, message };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createFaq, isSubmitting, errorMessage, setErrorMessage };
}

export default useCreateFaq;
