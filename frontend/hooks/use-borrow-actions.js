"use client";

import { API_BORROWS, API_BORROW_DETAIL } from "@/constants/api";
import { useRequestActions } from "@/hooks/use-request-actions";

function parseBorrowError(data, fallback = "Gagal menyimpan peminjaman.") {
  if (!data || typeof data !== "object") return fallback;
  if (typeof data.detail === "string") return data.detail;
  if (typeof data.non_field_errors?.[0] === "string")
    return data.non_field_errors[0];
  if (typeof data.equipment?.[0] === "string") return data.equipment[0];
  if (typeof data.quantity?.[0] === "string") return data.quantity[0];
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
    equipment: payload.equipmentId,
    quantity: Number(payload.quantity),
    start_time: buildDateTime(payload.startDate, payload.startTime),
    purpose: payload.purpose,
  };

  if (payload.endDate && payload.endTime) {
    body.end_time = buildDateTime(payload.endDate, payload.endTime);
  }
  if (payload.note?.trim()) body.note = payload.note.trim();

  return body;
}

export function useBorrowActions() {
  const actions = useRequestActions({
    createUrl: API_BORROWS,
    detailUrl: API_BORROW_DETAIL,
    buildPayload,
    parseError: parseBorrowError,
    messages: {
      create: "Gagal membuat peminjaman. Periksa data dan coba lagi.",
      update: "Gagal memperbarui peminjaman. Periksa data dan coba lagi.",
      delete: "Gagal menghapus peminjaman.",
    },
  });

  return {
    createBorrow: actions.createItem,
    updateBorrow: actions.updateItem,
    deleteBorrow: actions.deleteItem,
    isSubmitting: actions.isSubmitting,
    errorMessage: actions.errorMessage,
    setErrorMessage: actions.setErrorMessage,
  };
}

export default useBorrowActions;
