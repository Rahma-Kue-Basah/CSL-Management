"use client";

import { useState } from "react";

import { API_EQUIPMENT_DETAIL } from "@/constants/api";
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

  return { deleteEquipment, isDeleting, errorMessage, setErrorMessage };
}

export default useDeleteEquipment;
