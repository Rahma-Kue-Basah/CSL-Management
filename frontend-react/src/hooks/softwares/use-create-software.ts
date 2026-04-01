"use client";

import { useState } from "react";

import { API_SOFTWARES } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import { extractApiErrorMessage } from "@/lib/api-error";

export type CreateSoftwarePayload = {
  name: string;
  version?: string;
  licenseInfo?: string;
  licenseExpiration?: string;
  equipmentId: string;
  description?: string;
};

function parseSoftwareError(data: unknown, fallback = "Gagal membuat software.") {
  return extractApiErrorMessage(data, fallback, [
    "name",
    "version",
    "license_info",
    "license_expiration",
    "equipment",
    "description",
  ]);
}

export async function createSoftwareRequest(payload: CreateSoftwarePayload) {
  const body: Record<string, string> = {
    name: payload.name.trim(),
    equipment: payload.equipmentId,
  };

  if (payload.version?.trim()) body.version = payload.version.trim();
  if (payload.licenseInfo?.trim()) body.license_info = payload.licenseInfo.trim();
  if (payload.licenseExpiration?.trim()) body.license_expiration = payload.licenseExpiration.trim();
  if (payload.description?.trim()) body.description = payload.description.trim();

  const response = await authFetch(API_SOFTWARES, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (response.ok) {
    return { ok: true as const };
  }

  let message = "Gagal membuat software. Periksa data dan coba lagi.";
  try {
    const data = (await response.json()) as unknown;
    message = parseSoftwareError(data, message);
  } catch {
    // ignore parse error
  }

  return { ok: false as const, message };
}

export function useCreateSoftware() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createSoftware = async (payload: CreateSoftwarePayload) => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await createSoftwareRequest(payload);
      if (result.ok) {
        return { ok: true as const };
      }
      setErrorMessage(result.message);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan jaringan. Coba lagi.";
      setErrorMessage(message);
      return { ok: false as const, message };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createSoftware, isSubmitting, errorMessage, setErrorMessage };
}

export default useCreateSoftware;
