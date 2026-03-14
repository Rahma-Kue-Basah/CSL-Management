"use client";

import { useState } from "react";

import { API_SCHEDULE_DETAIL } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import type { ScheduleItem } from "@/hooks/schedules/use-schedules";

type UpdateSchedulePayload = {
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  category: string;
  room?: string | null;
  is_active: boolean;
};

export function useUpdateSchedule() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const updateSchedule = async (
    id: string | number,
    payload: UpdateSchedulePayload,
  ) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await authFetch(API_SCHEDULE_DETAIL(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        const detail =
          typeof (errorPayload as { detail?: string })?.detail === "string"
            ? (errorPayload as { detail?: string }).detail
            : "Gagal memperbarui jadwal.";
        const message = detail || "Gagal memperbarui jadwal.";
        setErrorMessage(message);
        return { ok: false as const, message };
      }

      const data = (await response.json().catch(() => null)) as ScheduleItem | null;
      return { ok: true as const, data };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat memperbarui jadwal.";
      setErrorMessage(message);
      return { ok: false as const, message };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { updateSchedule, isSubmitting, errorMessage, setErrorMessage };
}

export default useUpdateSchedule;
