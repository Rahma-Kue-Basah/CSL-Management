"use client";

import { useState } from "react";

import { API_ROOMS_BULK_CREATE } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import { extractApiErrorMessage } from "@/lib/api-error";
import { type CreateRoomPayload } from "@/hooks/rooms/use-create-room";

export type BulkRoomRow = Omit<CreateRoomPayload, "picIds" | "imageFile"> & {
  index: number;
  picId?: string;
};

type BulkRoomResult = {
  index: number;
  status: "success" | "error";
  message: string;
};

export function useBulkCreateRooms() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createRooms = async (
    rows: BulkRoomRow[],
    onProgress?: (results: BulkRoomResult[]) => void,
  ) => {
    setIsSubmitting(true);

    try {
      const response = await authFetch(API_ROOMS_BULK_CREATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: rows.map((row) => ({
            index: row.index,
            name: row.name.trim(),
            number: row.number.trim(),
            floor: row.floor.trim(),
            capacity: Number(row.capacity),
            description: row.description?.trim() || "",
            pics: row.picId ? [row.picId] : [],
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
