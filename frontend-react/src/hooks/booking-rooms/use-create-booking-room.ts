"use client";

import { useState } from "react";

import {
  extractApiErrorMessage,
  extractApiErrorMessageFromText,
} from "@/lib/core/api-error";
import {
  bookingRoomsService,
  type CreateBookingRoomPayload,
} from "@/services/booking-rooms/booking-rooms.service";

function parseBookingError(data: unknown, fallback = "Gagal membuat peminjaman lab.") {
  return extractApiErrorMessage(data, fallback, [
    "attendee_count",
    "requester_phone",
    "requester_mentor",
    "requester_mentor_profile",
    "institution",
    "institution_address",
    "workshop_title",
    "workshop_pic",
    "workshop_institution",
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
      const result = await bookingRoomsService.create(payload);

      if (result.ok) {
        return { ok: true as const };
      }

      let message = "Gagal membuat peminjaman lab. Periksa data lalu coba lagi.";
      if (typeof result.data !== "undefined") {
        message = parseBookingError(result.data, message);
      } else if (result.text) {
        message = extractApiErrorMessageFromText(result.text, message);
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
