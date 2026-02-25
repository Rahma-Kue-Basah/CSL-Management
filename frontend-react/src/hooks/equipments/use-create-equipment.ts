"use client";

import { useState } from "react";

import { API_EQUIPMENTS, API_IMAGES } from "@/constants/api";
import { authFetch } from "@/lib/auth";

type CreateEquipmentPayload = {
  name: string;
  quantity: string;
  category: string;
  roomId: string;
  isMoveable: boolean;
  description?: string;
  imageFile?: File | null;
};

function parseEquipmentError(data: unknown, fallback = "Gagal membuat peralatan.") {
  if (!data || typeof data !== "object") return fallback;
  const typed = data as Record<string, unknown>;

  if (typeof typed.detail === "string") return typed.detail;
  if (Array.isArray(typed.non_field_errors) && typeof typed.non_field_errors[0] === "string") {
    return typed.non_field_errors[0];
  }
  if (Array.isArray(typed.name) && typeof typed.name[0] === "string") return typed.name[0];
  if (Array.isArray(typed.quantity) && typeof typed.quantity[0] === "string") return typed.quantity[0];
  if (Array.isArray(typed.category) && typeof typed.category[0] === "string") return typed.category[0];
  if (Array.isArray(typed.room) && typeof typed.room[0] === "string") return typed.room[0];
  if (Array.isArray(typed.is_moveable) && typeof typed.is_moveable[0] === "string") return typed.is_moveable[0];
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
      message = parseEquipmentError(data, message);
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

export function useCreateEquipment() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createEquipment = async (payload: CreateEquipmentPayload) => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      let imageId: string | number | null = null;
      if (payload.imageFile) {
        imageId = await uploadImage(payload.imageFile);
      }

      const body: Record<string, string | number | boolean> = {
        name: payload.name.trim(),
        quantity: Number(payload.quantity),
        category: payload.category,
        room: payload.roomId,
        is_moveable: payload.isMoveable,
      };

      if (payload.description?.trim()) body.description = payload.description.trim();
      if (imageId) body.image = imageId;

      const response = await authFetch(API_EQUIPMENTS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        return { ok: true as const };
      }

      let message = "Gagal membuat peralatan. Periksa data dan coba lagi.";
      try {
        const data = (await response.json()) as unknown;
        message = parseEquipmentError(data, message);
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

  return { createEquipment, isSubmitting, errorMessage, setErrorMessage };
}

export default useCreateEquipment;
