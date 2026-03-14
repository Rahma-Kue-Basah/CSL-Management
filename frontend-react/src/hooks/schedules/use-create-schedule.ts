"use client";

import { useState } from "react";

import { API_SCHEDULES } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import type { ScheduleItem } from "@/hooks/schedules/use-schedules";

type CreateSchedulePayload = {
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  category: string;
  room?: string | null;
  is_active: boolean;
};

export function useCreateSchedule() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createSchedule = async (payload: CreateSchedulePayload) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await authFetch(API_SCHEDULES, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        const detail =
          typeof (errorPayload as { detail?: string })?.detail === "string"
            ? (errorPayload as { detail?: string }).detail
            : "Gagal membuat jadwal.";
        const message = detail || "Gagal membuat jadwal.";
        setErrorMessage(message);
        return { ok: false as const, message };
      }

      const data = (await response.json().catch(() => null)) as ScheduleItem | null;
      return { ok: true as const, data };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat membuat jadwal.";
      setErrorMessage(message);
      return { ok: false as const, message };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createSchedule, isSubmitting, errorMessage, setErrorMessage };
}

export default useCreateSchedule;
