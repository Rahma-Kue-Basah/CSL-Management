"use client";

import { useState } from "react";

import { API_IMAGES, API_ROOMS } from "@/constants/api";
import { authFetch } from "@/lib/auth";

type CreateRoomPayload = {
  name: string;
  capacity: string;
  number: string;
  floor: string;
  description?: string;
  picId?: string;
  imageFile?: File | null;
};

type RoomErrorPayload = Record<string, unknown>;

function parseRoomError(data: unknown, fallback = "Gagal membuat ruangan.") {
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

export function useCreateRoom() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createRoom = async (payload: CreateRoomPayload) => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      let imageId: string | number | null = null;
      if (payload.imageFile) {
        imageId = await uploadImage(payload.imageFile);
      }

      const body: Record<string, string | number> = {
        name: payload.name.trim(),
        capacity: Number(payload.capacity),
        number: payload.number.trim(),
        floor: Number(payload.floor),
      };

      if (payload.description?.trim()) body.description = payload.description.trim();
      if (payload.picId) body.pic = payload.picId;
      if (imageId) body.image = imageId;

      const response = await authFetch(API_ROOMS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        return { ok: true as const };
      }

      let message = "Gagal membuat ruangan. Periksa data dan coba lagi.";
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

  return { createRoom, isSubmitting, errorMessage, setErrorMessage };
}

export default useCreateRoom;
