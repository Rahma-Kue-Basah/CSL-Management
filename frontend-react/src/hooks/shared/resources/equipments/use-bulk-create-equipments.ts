"use client";

import { useState } from "react";
import { extractApiErrorMessage } from "@/lib/core";
import {
  equipmentsService,
  type BulkEquipmentResult,
  type BulkEquipmentRow,
} from "@/services/shared/resources";

export type { BulkEquipmentResult, BulkEquipmentRow };

export function useBulkCreateEquipments() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createEquipments = async (
    rows: BulkEquipmentRow[],
    onProgress?: (results: BulkEquipmentResult[]) => void,
  ) => {
    setIsSubmitting(true);

    try {
      const result = await equipmentsService.bulkCreate(rows);

      const data = (result.data ?? {}) as {
        results?: { index?: number; status?: "success" | "error"; message?: unknown }[];
        detail?: string;
      };

      if (!result.ok && !Array.isArray(data.results)) {
        throw new Error(
          extractApiErrorMessage(
            data,
            "Gagal membuat peralatan secara bulk.",
            ["detail"],
          ),
        );
      }

      const results: BulkEquipmentResult[] = (data.results || []).map((row) => ({
        index: Number(row.index) || 0,
        status: row.status === "success" ? "success" : "error",
        message:
          row.status === "success"
            ? "Sukses"
            : extractApiErrorMessage(
                row.message,
                "Terjadi kesalahan.",
                ["name", "quantity", "category", "room", "is_moveable", "image"],
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

  return { createEquipments, isSubmitting };
}

export default useBulkCreateEquipments;
