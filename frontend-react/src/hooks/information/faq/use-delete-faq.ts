"use client";

import { useState } from "react";
import { faqService } from "@/services/information";

export function useDeleteFaq() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const deleteFaq = async (id: string | number) => {
    setIsDeleting(true);
    setErrorMessage("");

    try {
      const result = await faqService.remove(id);

      if (result.ok || result.status === 204) {
        return { ok: true as const };
      }

      const payloadData = result.data ?? {};
      const detail =
        typeof (payloadData as { detail?: string })?.detail === "string"
          ? (payloadData as { detail?: string }).detail
          : `Gagal menghapus FAQ (${result.status})`;
      const message = detail || `Gagal menghapus FAQ (${result.status})`;
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

  const bulkDeleteFaqs = async (ids: Array<string | number>) => {
    setIsDeleting(true);
    setErrorMessage("");

    try {
      const result = await faqService.bulkRemove(ids);
      const payload = (result.data ?? {}) as {
        detail?: string;
        deleted_ids?: Array<string | number>;
        deleted_count?: number;
        failed_ids?: Array<string | number>;
        failed_count?: number;
      };

      if (!result.ok) {
        const message = payload.detail || `Gagal menghapus FAQ (${result.status})`;
        setErrorMessage(message);
        return { ok: false as const, message };
      }

      return {
        ok: true as const,
        deletedIds: payload.deleted_ids ?? [],
        deletedCount: payload.deleted_count ?? 0,
        failedIds: payload.failed_ids ?? [],
        failedCount: payload.failed_count ?? 0,
        message: payload.detail || "",
      };
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

  return { deleteFaq, bulkDeleteFaqs, isDeleting, errorMessage, setErrorMessage };
}

export default useDeleteFaq;
