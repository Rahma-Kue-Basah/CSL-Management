"use client";

import { useState } from "react";
import { extractApiErrorMessage } from "@/lib/core/api-error";
import { roomsService } from "@/services/shared/resources/rooms.service";

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
      const result = await roomsService.remove(roomId);

      if (result.ok || result.status === 204) {
        return { ok: true as const };
      }

      let message = `Gagal menghapus ruangan (${result.status}).`;
      if (typeof result.data !== "undefined") {
        message = parseDeleteRoomError(result.data, message);
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

  const deleteRooms = async (roomIds: Array<string | number>) => {
    if (!roomIds.length) {
      const message = "Pilih minimal satu ruangan.";
      setErrorMessage(message);
      return { ok: false as const, message };
    }

    setErrorMessage("");
    setIsDeleting(true);

    try {
      const result = await roomsService.bulkRemove(roomIds);

      const fallback = `Gagal menghapus ruangan terpilih (${result.ok ? 200 : result.status}).`;
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

      const message = data ? parseDeleteRoomError(data, fallback) : fallback;
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

  return { deleteRoom, deleteRooms, isDeleting, errorMessage, setErrorMessage };
}

export default useDeleteRoom;
