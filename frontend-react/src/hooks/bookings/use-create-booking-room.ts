"use client";

import { useState } from "react";

import { API_BOOKINGS } from "@/constants/api";
import { authFetch } from "@/lib/auth";

type CreateBookingRoomPayload = {
  roomId: string;
  purpose: string;
  startTime: string;
  endTime: string;
  note?: string;
  equipmentId?: string;
  quantityEquipment?: number;
};

type BookingErrorPayload = Record<string, unknown>;

function parseBookingError(data: unknown, fallback = "Gagal membuat booking ruangan.") {
  if (!data || typeof data !== "object") return fallback;
  const typed = data as BookingErrorPayload;

  if (typeof typed.detail === "string") return typed.detail;
  if (Array.isArray(typed.non_field_errors) && typeof typed.non_field_errors[0] === "string") {
    return typed.non_field_errors[0];
  }
  if (Array.isArray(typed.room) && typeof typed.room[0] === "string") return typed.room[0];
  if (Array.isArray(typed.purpose) && typeof typed.purpose[0] === "string") return typed.purpose[0];
  if (Array.isArray(typed.start_time) && typeof typed.start_time[0] === "string") {
    return typed.start_time[0];
  }
  if (Array.isArray(typed.end_time) && typeof typed.end_time[0] === "string") {
    return typed.end_time[0];
  }
  if (Array.isArray(typed.note) && typeof typed.note[0] === "string") return typed.note[0];
  if (Array.isArray(typed.equipment) && typeof typed.equipment[0] === "string") {
    return typed.equipment[0];
  }
  if (
    Array.isArray(typed.quantity_equipment) &&
    typeof typed.quantity_equipment[0] === "string"
  ) {
    return typed.quantity_equipment[0];
  }

  return fallback;
}

export function useCreateBookingRoom() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createBookingRoom = async (payload: CreateBookingRoomPayload) => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const body: Record<string, string> = {
        room: payload.roomId,
        purpose: payload.purpose.trim(),
        start_time: payload.startTime,
        end_time: payload.endTime,
      };
      if (payload.note?.trim()) body.note = payload.note.trim();
      if (payload.equipmentId?.trim()) {
        body.equipment = payload.equipmentId.trim();
      }
      if (typeof payload.quantityEquipment === "number" && payload.quantityEquipment > 0) {
        body.quantity_equipment = String(payload.quantityEquipment);
      }

      const response = await authFetch(API_BOOKINGS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        return { ok: true as const };
      }

      let message = "Gagal membuat booking ruangan. Periksa data lalu coba lagi.";
      try {
        const data = (await response.json()) as unknown;
        message = parseBookingError(data, message);
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

  return { createBookingRoom, isSubmitting, errorMessage, setErrorMessage };
}

export default useCreateBookingRoom;
