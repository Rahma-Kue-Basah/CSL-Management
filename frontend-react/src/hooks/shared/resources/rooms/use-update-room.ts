"use client";

import { useState } from "react";
import { extractApiErrorMessage } from "@/lib/core";
import {
  roomsService,
  type UpdateRoomPayload,
} from "@/services/shared/resources";

export type { UpdateRoomPayload };

function parseRoomError(data: unknown, fallback = "Gagal memperbarui ruangan.") {
  return extractApiErrorMessage(data, fallback, [
    "name",
    "capacity",
    "number",
    "floor",
    "pics",
    "image",
  ]);
}

export function useUpdateRoom() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const updateRoom = async (roomId: string | number, payload: UpdateRoomPayload) => {
    if (!roomId) {
      const message = "Room ID kosong.";
      setErrorMessage(message);
      return { ok: false as const, message };
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await roomsService.update(roomId, payload);

      if (result.ok) {
        return { ok: true as const, data: (result.data ?? {}) as Record<string, unknown> };
      }

      let message = `Gagal memperbarui ruangan (${result.status}).`;
      if (typeof result.data !== "undefined") {
        message = parseRoomError(result.data, message);
      }
      setErrorMessage(message);
      return { ok: false as const, message };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan jaringan. Coba lagi.";
      setErrorMessage(message);
      return { ok: false as const, message };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { updateRoom, isSubmitting, errorMessage, setErrorMessage };
}

export default useUpdateRoom;
