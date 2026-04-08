"use client";

import { useState } from "react";

import { extractApiErrorMessage } from "@/lib/core/api-error";
import {
  bookingRoomsService,
  type BookingStatusActionType,
} from "@/services/booking-rooms/booking-rooms.service";

function parseBookingStatusError(
  data: unknown,
  fallback = "Gagal memperbarui status booking.",
) {
  return extractApiErrorMessage(data, fallback);
}

export function useUpdateBookingStatus() {
  const [pendingAction, setPendingAction] = useState<{
    bookingId: string | number | null;
    type: BookingStatusActionType | null;
  }>({
    bookingId: null,
    type: null,
  });

  const updateBookingStatus = async (
    bookingId: string | number,
    type: BookingStatusActionType,
    payload?: { rejectionNote?: string },
  ) => {
    setPendingAction({ bookingId, type });

    try {
      const result = await bookingRoomsService.updateStatus(bookingId, type, payload);

      if (result.ok) {
        return { ok: true as const };
      }

      let message = "Gagal memperbarui status booking.";
      if (typeof result.data !== "undefined") {
        message = parseBookingStatusError(result.data, message);
      }

      return { ok: false as const, message };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan jaringan. Coba lagi.";
      return { ok: false as const, message };
    } finally {
      setPendingAction({ bookingId: null, type: null });
    }
  };

  return {
    updateBookingStatus,
    pendingAction,
  };
}

export default useUpdateBookingStatus;
