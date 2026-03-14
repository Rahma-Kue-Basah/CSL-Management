"use client";

import { useState } from "react";

import { authFetch } from "@/lib/auth";
import { buildFaqUrl, FAQS_ENDPOINT } from "@/hooks/faqs/utils";
import type { Faq } from "@/hooks/faqs/use-faqs";

type UpdateFaqPayload = {
  question: string;
  answer: string;
};

export function useUpdateFaq() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const updateFaq = async (
    id: string | number,
    payload: UpdateFaqPayload,
  ) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await authFetch(buildFaqUrl(FAQS_ENDPOINT, id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const payloadData = await response.json().catch(() => ({}));
        const detail =
          typeof (payloadData as { detail?: string })?.detail === "string"
            ? (payloadData as { detail?: string }).detail
            : "Gagal memperbarui FAQ.";
        const message = detail || "Gagal memperbarui FAQ.";
        setErrorMessage(message);
        return { ok: false as const, message };
      }

      const data = (await response.json().catch(() => null)) as Faq | null;
      return { ok: true as const, data };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat memperbarui FAQ.";
      setErrorMessage(message);
      return { ok: false as const, message };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { updateFaq, isSubmitting, errorMessage, setErrorMessage };
}

export default useUpdateFaq;
