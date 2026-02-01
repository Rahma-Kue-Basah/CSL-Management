"use client";

import { API_BOOKINGS } from "@/constants/api";
import { useRequestList } from "@/hooks/use-request-list";

const mapBooking = (item) => ({
  id: item.id,
  code: item.code || "-",
  room: item.room || null,
  roomDetail: item.room_detail || null,
  equipment: item.equipment || null,
  equipmentDetail: item.equipment_detail || null,
  quantityEquipment: item.quantity_equipment ?? null,
  startTime: item.start_time || null,
  endTime: item.end_time || null,
  status: item.status || "-",
  purpose: item.purpose || "",
  note: item.note || "",
  createdAt: item.created_at || null,
  requestedBy: item.requested_by || null,
  requestedByDetail: item.requested_by_detail || null,
  approvedBy: item.approved_by || null,
  approvedByDetail: item.approved_by_detail || null,
});

export function useBookings(page, pageSize = 20, filters = {}) {
  const result = useRequestList({
    apiUrl: API_BOOKINGS,
    page,
    pageSize,
    filters,
    buildParams: (url, next) => {
      if (next.status) url.searchParams.set("status", next.status);
      if (next.room) url.searchParams.set("room", next.room);
      if (next.equipment) url.searchParams.set("equipment", next.equipment);
      if (next.requested_by) url.searchParams.set("requested_by", next.requested_by);
    },
    mapItem: mapBooking,
    errorMessage: "Gagal memuat data booking.",
  });

  return {
    bookings: result.items,
    setBookings: result.setItems,
    totalCount: result.totalCount,
    setTotalCount: result.setTotalCount,
    isLoading: result.isLoading,
    error: result.error,
    setError: result.setError,
  };
}

export default useBookings;
