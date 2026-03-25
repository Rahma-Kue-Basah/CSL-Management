"use client";

import { useState } from "react";

import { API_BOOKINGS } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import { extractApiErrorMessage } from "@/lib/api-error";

type CreateBookingRoomPayload = {
  roomId: string;
  purpose: string;
  startTime: string;
  endTime: string;
  attendeeCount: number;
  attendeeNames?: string;
  note?: string;
  equipmentItems?: Array<{
    equipmentId: string;
    quantity: number;
  }>;
};

function parseBookingError(data: unknown, fallback = "Gagal membuat booking ruangan.") {
  return extractApiErrorMessage(data, fallback, [
    "attendee_count",
    "room",
    "purpose",
    "start_time",
    "end_time",
    "note",
    "equipment_items",
  ]);
}

export function useCreateBookingRoom() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createBookingRoom = async (payload: CreateBookingRoomPayload) => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        room: payload.roomId,
        purpose: payload.purpose.trim(),
        start_time: payload.startTime,
        end_time: payload.endTime,
        attendee_count: payload.attendeeCount,
      };
      if (payload.attendeeNames?.trim()) body.attendee_names = payload.attendeeNames.trim();
      if (payload.note?.trim()) body.note = payload.note.trim();
      if (Array.isArray(payload.equipmentItems) && payload.equipmentItems.length > 0) {
        body.equipment_items = payload.equipmentItems.map((item) => ({
          equipment: item.equipmentId.trim(),
          quantity: item.quantity,
        }));
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
