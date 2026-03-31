"use client";

import { useState } from "react";

import { API_SOFTWARE_DETAIL } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import { extractApiErrorMessage } from "@/lib/api-error";

type UpdateSoftwarePayload = {
  name: string;
  version?: string;
  licenseInfo?: string;
  licenseExpiration?: string;
  equipmentId: string;
  description?: string;
};

function parseSoftwareError(data: unknown, fallback = "Gagal memperbarui software.") {
  return extractApiErrorMessage(data, fallback, [
    "name",
    "version",
    "license_info",
    "license_expiration",
    "equipment",
    "description",
  ]);
}

export function useUpdateSoftware() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const updateSoftware = async (softwareId: string | number, payload: UpdateSoftwarePayload) => {
    if (!softwareId) {
      const message = "Software ID kosong.";
      setErrorMessage(message);
      return { ok: false as const, message };
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const body: Record<string, string> = {
        name: payload.name.trim(),
        equipment: payload.equipmentId,
        description: payload.description?.trim() || "",
      };
      if (payload.version?.trim()) body.version = payload.version.trim();
      if (payload.licenseInfo?.trim()) body.license_info = payload.licenseInfo.trim();
      if (payload.licenseExpiration?.trim()) {
        body.license_expiration = payload.licenseExpiration.trim();
      }

      const response = await authFetch(API_SOFTWARE_DETAIL(softwareId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        return { ok: true as const, data };
      }

      let message = `Gagal memperbarui software (${response.status}).`;
      try {
        const data = (await response.json()) as unknown;
        message = parseSoftwareError(data, message);
      } catch {
        // ignore parse error
      }
      setErrorMessage(message);
      return { ok: false as const, message };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan jaringan. Coba lagi.";
      setErrorMessage(message);
      return { ok: false as const, message };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { updateSoftware, isSubmitting, errorMessage, setErrorMessage };
}

export default useUpdateSoftware;
