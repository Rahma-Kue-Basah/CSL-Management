"use client";

import { useState } from "react";

import { API_IMAGES, API_EQUIPMENTS } from "@/constants/api";
import { authFetch } from "@/lib/auth-fetch";

function parseEquipmentError(data, fallback = "Gagal membuat equipment.") {
  if (!data || typeof data !== "object") return fallback;
  if (typeof data.detail === "string") return data.detail;
  if (typeof data.non_field_errors?.[0] === "string")
    return data.non_field_errors[0];
  if (typeof data.name?.[0] === "string") return data.name[0];
  if (typeof data.quantity?.[0] === "string") return data.quantity[0];
  if (typeof data.room?.[0] === "string") return data.room[0];
  if (typeof data.category?.[0] === "string") return data.category[0];
  if (typeof data.is_moveable?.[0] === "string") return data.is_moveable[0];
  if (typeof data.image?.[0] === "string") return data.image[0];
  return fallback;
}

async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const resp = await authFetch(API_IMAGES, {
    method: "POST",
    body: formData,
  });

  if (!resp.ok) {
    let message = "Gagal mengunggah gambar.";
    try {
      const data = await resp.json();
      message = parseEquipmentError(data, message);
    } catch (_) {
      // ignore parse error
    }
    throw new Error(message);
  }

  const data = await resp.json();
  if (!data?.id) {
    throw new Error("Response gambar tidak valid.");
  }
  return data.id;
}

export function useCreateEquipment() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createEquipment = async (payload) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      let imageId = null;
      if (payload?.imageFile) {
        imageId = await uploadImage(payload.imageFile);
      }

      const body = {
        name: payload.name?.trim(),
        quantity: Number(payload.quantity),
        category: payload.category,
        room: payload.roomId,
        is_moveable: payload.isMoveable,
      };

      if (payload.description?.trim()) body.description = payload.description.trim();
      if (imageId) body.image = imageId;

      const resp = await authFetch(API_EQUIPMENTS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (resp.ok) {
        return { ok: true };
      }

      let message = "Gagal membuat equipment. Periksa data dan coba lagi.";
      try {
        const data = await resp.json();
        message = parseEquipmentError(data, message);
      } catch (_) {
        // ignore parse error
      }
      setErrorMessage(message);
      return { ok: false, message };
    } catch (error) {
      const message = error.message || "Terjadi kesalahan jaringan. Coba lagi.";
      setErrorMessage(message);
      return { ok: false, message };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createEquipment,
    isSubmitting,
    errorMessage,
    setErrorMessage,
  };
}

export default useCreateEquipment;
