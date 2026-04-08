"use client";

import { useState } from "react";

import {
  extractApiErrorMessage,
  extractApiErrorMessageFromText,
} from "@/lib/core";
import { sampleTestingService } from "@/services/sample-testing";

import type { SampleTestingDocumentType } from "./use-sample-testing";

export function useUploadSampleTestingDocument() {
  const [pendingDocumentType, setPendingDocumentType] = useState<
    SampleTestingDocumentType | null
  >(null);

  const uploadDocument = async (
    sampleTestingId: string | number,
    documentType: SampleTestingDocumentType,
    file: File,
  ) => {
    setPendingDocumentType(documentType);

    try {
      const result = await sampleTestingService.uploadDocument(
        sampleTestingId,
        documentType,
        file,
      );

      if (!result.ok) {
        let message = "Gagal mengunggah dokumen pengujian sampel.";

        if (typeof result.data !== "undefined") {
          message = extractApiErrorMessage(result.data, message);
        } else if (result.text) {
          message = extractApiErrorMessageFromText(result.text, message);
        }

        return {
          ok: false as const,
          message,
        };
      }

      return {
        ok: true as const,
        data: (result.data ?? {}) as Record<string, unknown>,
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

export default useUploadSampleTestingDocument;
