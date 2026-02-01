"use client";

import { API_BORROWS } from "@/constants/api";
import { useRequestList } from "@/hooks/use-request-list";

const mapBorrow = (item) => ({
  id: item.id,
  code: item.code || "-",
  equipment: item.equipment || null,
  equipmentDetail: item.equipment_detail || null,
  quantity: item.quantity ?? null,
  startTime: item.start_time || null,
  endTime: item.end_time || null,
  endTimeActual: item.end_time_actual || null,
  status: item.status || "-",
  purpose: item.purpose || "",
  note: item.note || "",
  createdAt: item.created_at || null,
  requestedBy: item.requested_by || null,
  requestedByDetail: item.requested_by_detail || null,
  approvedBy: item.approved_by || null,
  approvedByDetail: item.approved_by_detail || null,
});

export function useBorrows(page, pageSize = 20, filters = {}) {
  const result = useRequestList({
    apiUrl: API_BORROWS,
    page,
    pageSize,
    filters,
    buildParams: (url, next) => {
      if (next.status) url.searchParams.set("status", next.status);
      if (next.equipment) url.searchParams.set("equipment", next.equipment);
      if (next.requested_by) url.searchParams.set("requested_by", next.requested_by);
    },
    mapItem: mapBorrow,
    errorMessage: "Gagal memuat data peminjaman.",
  });

  return {
    borrows: result.items,
    setBorrows: result.setItems,
    totalCount: result.totalCount,
    setTotalCount: result.setTotalCount,
    isLoading: result.isLoading,
    error: result.error,
    setError: result.setError,
  };
}

export default useBorrows;
