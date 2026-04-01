"use client";

import { useState } from "react";

import { API_EQUIPMENTS, API_IMAGES } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import { extractApiErrorMessage } from "@/lib/api-error";

export type CreateEquipmentPayload = {
  name: string;
  quantity: string;
  category: string;
  roomId: string;
  isMoveable: boolean;
  description?: string;
  imageFile?: File | null;
};

function parseEquipmentError(data: unknown, fallback = "Gagal membuat peralatan.") {
  return extractApiErrorMessage(data, fallback, [
    "name",
    "quantity",
    "category",
    "room",
    "is_moveable",
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

export async function createEquipmentRequest(payload: CreateEquipmentPayload) {
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

  return { ok: false as const, message };
}

export function useCreateEquipment() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createEquipment = async (payload: CreateEquipmentPayload) => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await createEquipmentRequest(payload);
      if (result.ok) {
        return { ok: true as const };
      }
      setErrorMessage(result.message);
      return result;
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
