"use client";

import { useState } from "react";

import { API_ROOMS } from "@/constants/api";
import { authFetch } from "@/lib/auth-fetch";

export function useDeleteRoom() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const deleteRoom = async (roomId) => {
    if (!roomId) return { ok: false, message: "Room ID kosong" };

    setIsDeleting(true);
    setErrorMessage("");

    try {
      const response = await authFetch(`${API_ROOMS}${roomId}/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok || response.status === 204) {
        return { ok: true };
      }

      let message = `Gagal menghapus ruangan (${response.status})`;
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
    deleteRoom,
    isDeleting,
    errorMessage,
    setErrorMessage,
  };
}

export default useDeleteRoom;
