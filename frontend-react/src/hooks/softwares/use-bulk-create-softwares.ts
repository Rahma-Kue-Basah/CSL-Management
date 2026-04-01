"use client";

import { useState } from "react";

import { API_SOFTWARES_BULK_CREATE } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import { extractApiErrorMessage } from "@/lib/api-error";
import { type CreateSoftwarePayload } from "@/hooks/softwares/use-create-software";

export type BulkSoftwareRow = Omit<CreateSoftwarePayload, "equipmentId"> & {
  index: number;
  equipmentId?: string;
};

type BulkSoftwareResult = {
  index: number;
  status: "success" | "error";
  message: string;
};

export function useBulkCreateSoftwares() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createSoftwares = async (
    rows: BulkSoftwareRow[],
    onProgress?: (results: BulkSoftwareResult[]) => void,
  ) => {
    setIsSubmitting(true);

    try {
      const response = await authFetch(API_SOFTWARES_BULK_CREATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: rows.map((row) => ({
            index: row.index,
            name: row.name.trim(),
            version: row.version?.trim() || "",
            license_info: row.licenseInfo?.trim() || "",
            license_expiration: row.licenseExpiration?.trim() || "",
            equipment: row.equipmentId || "",
            description: row.description?.trim() || "",
          })),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        results?: { index?: number; status?: "success" | "error"; message?: unknown }[];
        detail?: string;
      };

      if (!response.ok && !Array.isArray(data.results)) {
        throw new Error(
          extractApiErrorMessage(
            data,
            "Gagal membuat software secara bulk.",
            ["detail"],
          ),
        );
      }

      const results: BulkSoftwareResult[] = (data.results || []).map((row) => ({
        index: Number(row.index) || 0,
        status: row.status === "success" ? "success" : "error",
        message:
          row.status === "success"
            ? "Sukses"
            : extractApiErrorMessage(
                row.message,
                "Terjadi kesalahan.",
                ["name", "version", "license_info", "license_expiration", "equipment", "description"],
              ),
      }));
      onProgress?.(results);
      return results;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Terjadi kesalahan.";
      const results = rows.map((row) => ({
        index: row.index,
        status: "error" as const,
        message,
      }));
      onProgress?.(results);
      return results;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createSoftwares, isSubmitting };
}

export default useBulkCreateSoftwares;
