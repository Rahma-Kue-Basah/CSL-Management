"use client";

import { useState } from "react";

import { API_SCHEDULES_BULK_CREATE } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import { extractApiErrorMessage } from "@/lib/api-error";

export type BulkScheduleRow = {
  index: number;
  title: string;
  className: string;
  description: string;
  category: "Practicum";
  room: string;
  startTime: string;
  endTime: string;
};

type BulkScheduleResult = {
  index: number;
  status: "success" | "error";
  message: string;
};

export function useBulkCreateSchedules() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createSchedules = async (
    rows: BulkScheduleRow[],
    onProgress?: (results: BulkScheduleResult[]) => void,
  ) => {
    setIsSubmitting(true);

    try {
      const response = await authFetch(API_SCHEDULES_BULK_CREATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: rows.map((row) => ({
            index: row.index,
            title: row.title,
            class_name: row.className || null,
            description: row.description,
            category: row.category,
            room: row.room || null,
            start_time: row.startTime,
            end_time: row.endTime,
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
            "Gagal membuat jadwal secara bulk.",
            ["detail"],
          ),
        );
      }

      const results: BulkScheduleResult[] = (data.results || []).map((row) => ({
        index: Number(row.index) || 0,
        status: row.status === "success" ? "success" : "error",
        message:
          row.status === "success"
            ? "Sukses"
            : extractApiErrorMessage(
                row.message,
                "Terjadi kesalahan.",
                [
                  "title",
                  "class_name",
                  "description",
                  "category",
                  "room",
                  "start_time",
                  "end_time",
                  "non_field_errors",
                ],
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

  return { createSchedules, isSubmitting };
}

export default useBulkCreateSchedules;
