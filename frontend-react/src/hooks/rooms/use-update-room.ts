"use client";

import { useState } from "react";

import { API_IMAGES, API_IMAGE_DETAIL, API_ROOM_DETAIL } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import { extractApiErrorMessage } from "@/lib/api-error";

type UpdateRoomPayload = {
  name: string;
  number: string;
  floor: string;
  capacity: string;
  description?: string;
  picIds?: string[];
  imageId?: string | number | null;
  imageFile?: File | null;
};

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

async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await authFetch(API_IMAGES, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = "Gagal mengunggah gambar.";
    try {
      const data = (await response.json()) as unknown;
      message = parseRoomError(data, message);
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  const data = (await response.json()) as { id?: string | number };
  if (!data?.id) {
    throw new Error("Response gambar tidak valid.");
  }

  return data.id;
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
      let nextImageId = payload.imageId ?? null;
      if (payload.imageFile) {
        nextImageId = await uploadImage(payload.imageFile);
      }

      const body: Record<string, string | number | string[] | null> = {
        name: payload.name.trim(),
        number: payload.number.trim(),
        floor: Number(payload.floor),
        capacity: Number(payload.capacity),
      };

      body.description = payload.description?.trim() || "";
      body.pics = payload.picIds ?? [];
      if (nextImageId) body.image = nextImageId;

      const response = await authFetch(API_ROOM_DETAIL(roomId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

        // Backend already removes old room images on replace; this is a best-effort fallback cleanup.
        if (
          payload.imageFile &&
          payload.imageId &&
          nextImageId &&
          String(payload.imageId) !== String(nextImageId)
        ) {
          try {
            await authFetch(API_IMAGE_DETAIL(payload.imageId), { method: "DELETE" });
          } catch {
            // ignore cleanup errors
          }
        }

        return { ok: true as const, data };
      }

      let message = `Gagal memperbarui ruangan (${response.status}).`;
      try {
        const data = (await response.json()) as unknown;
        message = parseRoomError(data, message);
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
      setIsSubmitting(false);
    }
  };

  return { updateRoom, isSubmitting, errorMessage, setErrorMessage };
}

export default useUpdateRoom;
