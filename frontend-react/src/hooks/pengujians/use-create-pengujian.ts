"use client";

import { useState } from "react";

import { API_PENGUJIANS } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import {
  extractApiErrorMessage,
  extractApiErrorMessageFromText,
} from "@/lib/api-error";

type CreatePengujianPayload = {
  name: string;
  institution?: string;
  institutionAddress?: string;
  email: string;
  phoneNumber?: string;
  sampleName?: string;
  sampleType: string;
  sampleBrand?: string;
  samplePackaging?: string;
  sampleWeight?: string;
  sampleQuantity?: string;
  sampleTestingServing?: string;
  sampleTestingMethod?: string;
  sampleTestingType?: string;
};

function parsePengujianError(
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

export function useCreatePengujian() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createPengujian = async (payload: CreatePengujianPayload) => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const body: Record<string, string> = {
        name: payload.name.trim(),
        email: payload.email.trim(),
        sample_type: payload.sampleType.trim(),
      };

      if (payload.institution?.trim()) body.institution = payload.institution.trim();
      if (payload.institutionAddress?.trim()) {
        body.institution_address = payload.institutionAddress.trim();
      }
      if (payload.phoneNumber?.trim()) body.phone_number = payload.phoneNumber.trim();
      if (payload.sampleName?.trim()) body.sample_name = payload.sampleName.trim();
      if (payload.sampleBrand?.trim()) body.sample_brand = payload.sampleBrand.trim();
      if (payload.samplePackaging?.trim()) {
        body.sample_packaging = payload.samplePackaging.trim();
      }
      if (payload.sampleWeight?.trim()) body.sample_weight = payload.sampleWeight.trim();
      if (payload.sampleQuantity?.trim()) {
        body.sample_quantity = payload.sampleQuantity.trim();
      }
      if (payload.sampleTestingServing?.trim()) {
        body.sample_testing_serving = payload.sampleTestingServing.trim();
      }
      if (payload.sampleTestingMethod?.trim()) {
        body.sample_testing_method = payload.sampleTestingMethod.trim();
      }
      if (payload.sampleTestingType?.trim()) {
        body.sample_testing_type = payload.sampleTestingType.trim();
      }

      const response = await authFetch(API_PENGUJIANS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        return { ok: true as const };
      }

      let message =
        "Gagal membuat pengajuan pengujian sampel. Periksa data lalu coba lagi.";
      try {
        const raw = await response.text();
        try {
          const data = JSON.parse(raw) as unknown;
          message = parsePengujianError(data, message);
        } catch {
          message = extractApiErrorMessageFromText(raw, message);
        }
      } catch {
        // ignore parse error
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

  return { createPengujian, isSubmitting, errorMessage, setErrorMessage };
}

export default useCreatePengujian;
