"use client";

import { API_BOOKINGS, API_BOOKING_DETAIL } from "@/constants/api";
import { useRequestActions } from "@/hooks/use-request-actions";

function parseBookingError(data, fallback = "Gagal menyimpan booking.") {
  if (!data || typeof data !== "object") return fallback;
  if (typeof data.detail === "string") return data.detail;
  if (typeof data.non_field_errors?.[0] === "string")
    return data.non_field_errors[0];
  if (typeof data.room?.[0] === "string") return data.room[0];
  if (typeof data.equipment?.[0] === "string") return data.equipment[0];
  if (typeof data.quantity_equipment?.[0] === "string")
    return data.quantity_equipment[0];
  if (typeof data.start_time?.[0] === "string") return data.start_time[0];
  if (typeof data.end_time?.[0] === "string") return data.end_time[0];
  if (typeof data.purpose?.[0] === "string") return data.purpose[0];
  return fallback;
}

function buildDateTime(date, time) {
  if (!date || !time) return null;
  const [hours, minutes] = time.split(":").map((item) => Number(item));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  const dt = new Date(date);
  dt.setHours(hours, minutes, 0, 0);
  return dt.toISOString();
}

function buildPayload(payload) {
  const body = {
    room: payload.roomId,
    start_time: buildDateTime(payload.startDate, payload.startTime),
    end_time: buildDateTime(payload.endDate, payload.endTime),
    purpose: payload.purpose,
  };

  if (payload.equipmentId) body.equipment = payload.equipmentId;
  if (payload.quantityEquipment)
    body.quantity_equipment = Number(payload.quantityEquipment);
  if (payload.note?.trim()) body.note = payload.note.trim();

  return body;
}

export function useBookingActions() {
  const actions = useRequestActions({
    createUrl: API_BOOKINGS,
    detailUrl: API_BOOKING_DETAIL,
    buildPayload,
    parseError: parseBookingError,
    messages: {
      create: "Gagal membuat booking. Periksa data dan coba lagi.",
      update: "Gagal memperbarui booking. Periksa data dan coba lagi.",
      delete: "Gagal menghapus booking.",
    },
  });

  return {
    createBooking: actions.createItem,
    updateBooking: actions.updateItem,
    deleteBooking: actions.deleteItem,
    isSubmitting: actions.isSubmitting,
    errorMessage: actions.errorMessage,
    setErrorMessage: actions.setErrorMessage,
  };
}

export default useBookingActions;
