"use client";

import { useState } from "react";
import { extractApiErrorMessage } from "@/lib/core/api-error";
import { equipmentsService } from "@/services/shared/resources/equipments.service";

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
      const result = await equipmentsService.remove(equipmentId);

      if (result.ok || result.status === 204) {
        return { ok: true as const };
      }

      let message = `Gagal menghapus peralatan (${result.status}).`;
      if (typeof result.data !== "undefined") {
        message = parseDeleteEquipmentError(result.data, message);
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
      const result = await equipmentsService.bulkRemove(equipmentIds);

      const fallback = `Gagal menghapus peralatan terpilih (${result.ok ? 200 : result.status}).`;
      const data = (result.data ?? null) as
        | {
            detail?: string;
            deleted_ids?: Array<string | number>;
            deleted_count?: number;
            failed_count?: number;
            message?: string;
          }
        | null;

      if (result.ok || result.status === 207) {
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
