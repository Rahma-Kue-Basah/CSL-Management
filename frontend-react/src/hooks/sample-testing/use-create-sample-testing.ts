"use client";

import { useState } from "react";

import {
  extractApiErrorMessage,
  extractApiErrorMessageFromText,
} from "@/lib/core";
import {
  type CreateSampleTestingPayload,
  sampleTestingService,
} from "@/services/sample-testing";

function parseSampleTestingError(
  data: unknown,
  fallback = "Gagal membuat pengajuan pengujian sampel.",
) {
  return extractApiErrorMessage(data, fallback, [
    "name",
    "institution",
    "institution_address",
    "email",
    "phone_number",
    "sample_name",
    "sample_type",
    "sample_brand",
    "sample_packaging",
    "sample_weight",
    "sample_quantity",
    "sample_testing_serving",
    "sample_testing_method",
    "sample_testing_type",
  ]);
}

export function useCreateSampleTesting() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createSampleTesting = async (payload: CreateSampleTestingPayload) => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await sampleTestingService.create(payload);

      if (result.ok) {
        return { ok: true as const };
      }

      let message =
        "Gagal membuat pengajuan pengujian sampel. Periksa data lalu coba lagi.";
      if (typeof result.data !== "undefined") {
        message = parseSampleTestingError(result.data, message);
      } else if (result.text) {
        message = extractApiErrorMessageFromText(result.text, message);
      }

      setErrorMessage(message);
      return { ok: false as const, message };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan jaringan. Coba lagi.";
      setErrorMessage(message);
      return { ok: false as const, message };
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateSampleTesting = async (
    sampleTestingId: string | number,
    payload: CreateSampleTestingPayload,
  ) => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await sampleTestingService.update(sampleTestingId, payload);

      if (result.ok) {
        return { ok: true as const };
      }

      let message =
        "Gagal memperbarui pengajuan pengujian sampel. Periksa data lalu coba lagi.";
      if (typeof result.data !== "undefined") {
        message = parseSampleTestingError(result.data, message);
      } else if (result.text) {
        message = extractApiErrorMessageFromText(result.text, message);
      }

      setErrorMessage(message);
      return { ok: false as const, message };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan jaringan. Coba lagi.";
      setErrorMessage(message);
      return { ok: false as const, message };
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteSampleTesting = async (sampleTestingId: string | number) => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await sampleTestingService.remove(sampleTestingId);

      if (result.ok) {
        return { ok: true as const };
      }

      let message = "Gagal menghapus pengajuan pengujian sampel.";
      if (typeof result.data !== "undefined") {
        message = parseSampleTestingError(result.data, message);
      } else if (result.text) {
        message = extractApiErrorMessageFromText(result.text, message);
      }

      setErrorMessage(message);
      return { ok: false as const, message };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan jaringan. Coba lagi.";
      setErrorMessage(message);
      return { ok: false as const, message };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createSampleTesting,
    updateSampleTesting,
    deleteSampleTesting,
    isSubmitting,
    errorMessage,
    setErrorMessage,
  };
}

export default useCreateSampleTesting;
