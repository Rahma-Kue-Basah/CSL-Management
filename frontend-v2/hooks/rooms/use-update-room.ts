"use client";

import { useState } from "react";

import { API_IMAGES, API_IMAGE_DETAIL, API_ROOM_DETAIL } from "@/constants/api";
import { authFetch } from "@/lib/auth";

type UpdateRoomPayload = {
  name: string;
  number: string;
  floor: string;
  capacity: string;
  description?: string;
  picId?: string;
  imageId?: string | number | null;
  imageFile?: File | null;
};

type RoomErrorPayload = Record<string, unknown>;

function parseRoomError(data: unknown, fallback = "Gagal memperbarui ruangan.") {
  if (!data || typeof data !== "object") return fallback;
  const typed = data as RoomErrorPayload;

  if (typeof typed.detail === "string") return typed.detail;
  if (Array.isArray(typed.non_field_errors) && typeof typed.non_field_errors[0] === "string") {
    return typed.non_field_errors[0];
  }
  if (Array.isArray(typed.name) && typeof typed.name[0] === "string") return typed.name[0];
  if (Array.isArray(typed.capacity) && typeof typed.capacity[0] === "string") return typed.capacity[0];
  if (Array.isArray(typed.number) && typeof typed.number[0] === "string") return typed.number[0];
  if (Array.isArray(typed.floor) && typeof typed.floor[0] === "string") return typed.floor[0];
  if (Array.isArray(typed.pic) && typeof typed.pic[0] === "string") return typed.pic[0];
  if (Array.isArray(typed.image) && typeof typed.image[0] === "string") return typed.image[0];

  return fallback;
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

      const body: Record<string, string | number | null> = {
        name: payload.name.trim(),
        number: payload.number.trim(),
        floor: Number(payload.floor),
        capacity: Number(payload.capacity),
      };

      body.description = payload.description?.trim() || "";
      body.pic = payload.picId || null;
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
