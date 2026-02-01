"use client";

import { useState } from "react";

import { API_EQUIPMENTS } from "@/constants/api";
import { authFetch } from "@/lib/auth-fetch";

export function useDeleteEquipment() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const deleteEquipment = async (equipmentId) => {
    if (!equipmentId) return { ok: false, message: "Equipment ID kosong" };

    setIsDeleting(true);
    setErrorMessage("");

    try {
      const response = await authFetch(`${API_EQUIPMENTS}${equipmentId}/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok || response.status === 204) {
        return { ok: true };
      }

      let message = `Gagal menghapus equipment (${response.status})`;
      try {
        const data = await response.json();
        if (typeof data.detail === "string") message = data.detail;
      } catch (_) {
        // ignore parse error
      }

      setErrorMessage(message);
      return { ok: false, message };
    } catch (error) {
      const message = error.message || "Terjadi kesalahan jaringan. Coba lagi.";
      setErrorMessage(message);
      return { ok: false, message };
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteEquipment,
    isDeleting,
    errorMessage,
    setErrorMessage,
  };
}

export default useDeleteEquipment;
