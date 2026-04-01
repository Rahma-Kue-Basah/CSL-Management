"use client";

import { useState } from "react";

import { API_EQUIPMENTS_BULK_CREATE } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import { extractApiErrorMessage } from "@/lib/api-error";
import { type CreateEquipmentPayload } from "@/hooks/equipments/use-create-equipment";

export type BulkEquipmentRow = Omit<CreateEquipmentPayload, "roomId" | "imageFile"> & {
  index: number;
  roomId?: string;
};

type BulkEquipmentResult = {
  index: number;
  status: "success" | "error";
  message: string;
};

export function useBulkCreateEquipments() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createEquipments = async (
    rows: BulkEquipmentRow[],
    onProgress?: (results: BulkEquipmentResult[]) => void,
  ) => {
    setIsSubmitting(true);

    try {
      const response = await authFetch(API_EQUIPMENTS_BULK_CREATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: rows.map((row) => ({
            index: row.index,
            name: row.name.trim(),
            quantity: Number(row.quantity),
            category: row.category,
            room: row.roomId || "",
            is_moveable: row.isMoveable,
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
