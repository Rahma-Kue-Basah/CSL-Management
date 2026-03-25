"use client";

import { useState } from "react";

import { API_ROOM_DETAIL } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import { extractApiErrorMessage } from "@/lib/api-error";

function parseDeleteRoomError(data: unknown, fallback = "Gagal menghapus ruangan.") {
  return extractApiErrorMessage(data, fallback);
}

export function useDeleteRoom() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const deleteRoom = async (roomId: string | number) => {
    if (!roomId) {
      const message = "Room ID kosong.";
      setErrorMessage(message);
      return { ok: false as const, message };
    }

    setErrorMessage("");
    setIsDeleting(true);

    try {
      const response = await authFetch(API_ROOM_DETAIL(roomId), {
        method: "DELETE",
      });

      if (response.ok || response.status === 204) {
        return { ok: true as const };
      }

      let message = `Gagal menghapus ruangan (${response.status}).`;
      try {
        const data = (await response.json()) as unknown;
        message = parseDeleteRoomError(data, message);
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

  return { deleteRoom, isDeleting, errorMessage, setErrorMessage };
}

export default useDeleteRoom;
