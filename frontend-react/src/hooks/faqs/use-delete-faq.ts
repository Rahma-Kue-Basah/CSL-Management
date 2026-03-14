"use client";

import { useState } from "react";

import { authFetch } from "@/lib/auth";
import { buildFaqUrl, FAQS_ENDPOINT } from "@/hooks/faqs/utils";

export function useDeleteFaq() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const deleteFaq = async (id: string | number) => {
    setIsDeleting(true);
    setErrorMessage("");

    try {
      const response = await authFetch(buildFaqUrl(FAQS_ENDPOINT, id), {
        method: "DELETE",
      });

      if (response.ok || response.status === 204) {
        return { ok: true as const };
      }

      const payloadData = await response.json().catch(() => ({}));
      const detail =
        typeof (payloadData as { detail?: string })?.detail === "string"
          ? (payloadData as { detail?: string }).detail
          : `Gagal menghapus FAQ (${response.status})`;
      const message = detail || `Gagal menghapus FAQ (${response.status})`;
      setErrorMessage(message);
      return { ok: false as const, message };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menghapus FAQ.";
      setErrorMessage(message);
      return { ok: false as const, message };
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteFaq, isDeleting, errorMessage, setErrorMessage };
}

export default useDeleteFaq;
