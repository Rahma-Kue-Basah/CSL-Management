"use client";

import { useState } from "react";
import { extractApiErrorMessage } from "@/lib/core/api-error";
import {
  softwaresService,
  type BulkSoftwareResult,
  type BulkSoftwareRow,
} from "@/services/shared/resources/softwares.service";

export type { BulkSoftwareResult, BulkSoftwareRow };

export function useBulkCreateSoftwares() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createSoftwares = async (
    rows: BulkSoftwareRow[],
    onProgress?: (results: BulkSoftwareResult[]) => void,
  ) => {
    setIsSubmitting(true);

    try {
      const result = await softwaresService.bulkCreate(rows);

      const data = (result.data ?? {}) as {
        results?: { index?: number; status?: "success" | "error"; message?: unknown }[];
        detail?: string;
      };

      if (!result.ok && !Array.isArray(data.results)) {
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
