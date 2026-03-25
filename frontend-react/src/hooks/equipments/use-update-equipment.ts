"use client";

import { useState } from "react";

import { API_EQUIPMENT_DETAIL, API_IMAGES, API_IMAGE_DETAIL } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import { extractApiErrorMessage } from "@/lib/api-error";

type UpdateEquipmentPayload = {
  name: string;
  quantity: string;
  category: string;
  roomId: string;
  isMoveable: boolean;
  description?: string;
  imageId?: string | number | null;
  imageFile?: File | null;
};

function parseEquipmentError(data: unknown, fallback = "Gagal memperbarui peralatan.") {
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

export function useUpdateEquipment() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const updateEquipment = async (equipmentId: string | number, payload: UpdateEquipmentPayload) => {
    if (!equipmentId) {
      const message = "Equipment ID kosong.";
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

      const body: Record<string, string | number | boolean | null> = {
        name: payload.name.trim(),
        quantity: Number(payload.quantity),
        category: payload.category,
        room: payload.roomId,
        is_moveable: payload.isMoveable,
        description: payload.description?.trim() || "",
      };

      if (nextImageId) body.image = nextImageId;

      const response = await authFetch(API_EQUIPMENT_DETAIL(equipmentId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

        // Backend already removes old image; keep best-effort fallback cleanup.
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

      let message = `Gagal memperbarui peralatan (${response.status}).`;
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

  return { updateEquipment, isSubmitting, errorMessage, setErrorMessage };
}

export default useUpdateEquipment;
