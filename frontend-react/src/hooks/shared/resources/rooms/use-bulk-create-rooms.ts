"use client";

import { useState } from "react";
import { extractApiErrorMessage } from "@/lib/core/api-error";
import {
  roomsService,
  type BulkRoomResult,
  type BulkRoomRow,
} from "@/services/shared/resources/rooms.service";

export type { BulkRoomResult, BulkRoomRow };

export function useBulkCreateRooms() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createRooms = async (
    rows: BulkRoomRow[],
    onProgress?: (results: BulkRoomResult[]) => void,
  ) => {
    setIsSubmitting(true);

    try {
      const result = await roomsService.bulkCreate(rows);

      const data = (result.data ?? {}) as {
        results?: { index?: number; status?: "success" | "error"; message?: unknown }[];
        detail?: string;
      };

      if (!result.ok && !Array.isArray(data.results)) {
        throw new Error(
          extractApiErrorMessage(
            data,
            "Gagal membuat ruangan secara bulk.",
            ["detail"],
          ),
        );
      }

      const results: BulkRoomResult[] = (data.results || []).map((row) => ({
        index: Number(row.index) || 0,
        status: row.status === "success" ? "success" : "error",
        message:
          row.status === "success"
            ? "Sukses"
            : extractApiErrorMessage(
                row.message,
                "Terjadi kesalahan.",
                ["name", "capacity", "number", "floor", "pics", "image"],
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

  return { createRooms, isSubmitting };
}

export default useBulkCreateRooms;
