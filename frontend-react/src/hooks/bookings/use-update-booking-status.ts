"use client";

import { useState } from "react";

import {
  API_BOOKING_APPROVE,
  API_BOOKING_REJECT,
} from "@/constants/api";
import { authFetch } from "@/lib/auth";
import { extractApiErrorMessage } from "@/lib/api-error";

export type BookingStatusActionType = "approve" | "reject";

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
      const response = await authFetch(
        type === "approve"
          ? API_BOOKING_APPROVE(bookingId)
          : API_BOOKING_REJECT(bookingId),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            type === "reject" && payload?.rejectionNote?.trim()
              ? { rejection_note: payload.rejectionNote.trim() }
              : {},
          ),
        },
      );

      if (response.ok) {
        return { ok: true as const };
      }

      let message = "Gagal memperbarui status booking.";
      try {
        const data = (await response.json()) as unknown;
        message = parseBookingStatusError(data, message);
      } catch {
        // ignore parse error
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
