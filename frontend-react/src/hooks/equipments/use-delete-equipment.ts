"use client";

import { useState } from "react";

import { API_EQUIPMENT_DETAIL, API_EQUIPMENTS_BULK_DELETE } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import { extractApiErrorMessage } from "@/lib/api-error";

function parseDeleteEquipmentError(data: unknown, fallback = "Gagal menghapus peralatan.") {
  return extractApiErrorMessage(data, fallback);
}

export function useDeleteEquipment() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const deleteEquipment = async (equipmentId: string | number) => {
    if (!equipmentId) {
      const message = "Equipment ID kosong.";
      setErrorMessage(message);
      return { ok: false as const, message };
    }

    setErrorMessage("");
    setIsDeleting(true);

    try {
      const response = await authFetch(API_EQUIPMENT_DETAIL(equipmentId), {
        method: "DELETE",
      });

      if (response.ok || response.status === 204) {
        return { ok: true as const };
      }

      let message = `Gagal menghapus peralatan (${response.status}).`;
      try {
        const data = (await response.json()) as unknown;
        message = parseDeleteEquipmentError(data, message);
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
      setIsDeleting(false);
    }
  };

  const deleteEquipments = async (equipmentIds: Array<string | number>) => {
    if (!equipmentIds.length) {
      const message = "Pilih minimal satu peralatan.";
      setErrorMessage(message);
      return { ok: false as const, message };
    }

    setErrorMessage("");
    setIsDeleting(true);

    try {
      const response = await authFetch(API_EQUIPMENTS_BULK_DELETE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: equipmentIds }),
      });

      const fallback = `Gagal menghapus peralatan terpilih (${response.status}).`;
      const data = (await response.json().catch(() => null)) as
        | {
            detail?: string;
            deleted_ids?: Array<string | number>;
            deleted_count?: number;
            failed_count?: number;
            message?: string;
          }
        | null;

      if (response.ok || response.status === 207) {
        return {
          ok: true as const,
          deletedIds: Array.isArray(data?.deleted_ids) ? data.deleted_ids : [],
          deletedCount: Number(data?.deleted_count ?? 0),
          failedCount: Number(data?.failed_count ?? 0),
          message: typeof data?.detail === "string" ? data.detail : undefined,
        };
      }

      const message = data ? parseDeleteEquipmentError(data, fallback) : fallback;
      setErrorMessage(message);
      return { ok: false as const, message };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan jaringan. Coba lagi.";
      setErrorMessage(message);
      return { ok: false as const, message };
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteEquipment, deleteEquipments, isDeleting, errorMessage, setErrorMessage };
}

export default useDeleteEquipment;
