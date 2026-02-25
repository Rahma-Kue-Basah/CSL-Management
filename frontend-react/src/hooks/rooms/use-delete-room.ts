"use client";

import { useState } from "react";

import { API_ROOM_DETAIL } from "@/constants/api";
import { authFetch } from "@/lib/auth";

function parseDeleteRoomError(data: unknown, fallback = "Gagal menghapus ruangan.") {
  if (!data || typeof data !== "object") return fallback;
  const typed = data as Record<string, unknown>;

  if (typeof typed.detail === "string") return typed.detail;
  if (Array.isArray(typed.non_field_errors) && typeof typed.non_field_errors[0] === "string") {
    return typed.non_field_errors[0];
  }

  return fallback;
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
