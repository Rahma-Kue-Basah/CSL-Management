"use client";

import { useState } from "react";

import { API_PENGUJIAN_UPLOAD_DOCUMENT } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import {
  extractApiErrorMessage,
  extractApiErrorMessageFromText,
} from "@/lib/api-error";

import type { PengujianDocumentType } from "./use-pengujians";

export function useUploadPengujianDocument() {
  const [pendingDocumentType, setPendingDocumentType] = useState<
    PengujianDocumentType | null
  >(null);

  const uploadDocument = async (
    pengujianId: string | number,
    documentType: PengujianDocumentType,
    file: File,
  ) => {
    setPendingDocumentType(documentType);

    try {
      const formData = new FormData();
      formData.set("document_type", documentType);
      formData.set("file", file);

      const response = await authFetch(API_PENGUJIAN_UPLOAD_DOCUMENT(pengujianId), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let message = "Gagal mengunggah dokumen pengujian sampel.";

        try {
          const data = (await response.json()) as unknown;
          message = extractApiErrorMessage(data, message);
        } catch {
          try {
            const text = await response.text();
            message = extractApiErrorMessageFromText(text, message);
          } catch {
            // Keep fallback message.
          }
        }

        return {
          ok: false as const,
          message,
        };
      }

      const payload = (await response.json()) as Record<string, unknown>;
      return {
        ok: true as const,
        data: payload,
      };
    } catch (error) {
      return {
        ok: false as const,
        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat mengunggah dokumen.",
      };
    } finally {
      setPendingDocumentType(null);
    }
  };

  return {
    uploadDocument,
    pendingDocumentType,
  };
}

export default useUploadPengujianDocument;
